'use strict'

import Web3Util from '../helpers/web3'
import BigNumber from 'bignumber.js'

const db = require('../models')
const config = require('config')
const TomoValidatorABI = require('../contracts/abi/TomoValidator')
const contractAddress = require('../contracts/contractAddress')

const consumer = {}
consumer.name = 'VoterProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let currentEpoch = job.data.epoch
    let epoch = parseInt(currentEpoch) - 1
    console.log('Get all voter at epoch: ', epoch)

    let endBlock = epoch * config.get('BLOCK_PER_EPOCH')
    let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1

    try {
        let web3 = await Web3Util.getWeb3()
        let validatorContract = await new web3.eth.Contract(TomoValidatorABI, contractAddress.TomoValidator)
        let validators = await validatorContract.methods.getCandidates().call()

        let validatorMap = validators.map(async (validator) => {
            validator = validator.toString().toLowerCase()
            let listVoters = []
            let voters = await validatorContract.methods.getVoters(validator).call()
            let voterMap = voters.map(async (voter) => {
                voter = voter.toString().toLowerCase()
                let voterBalance = await validatorContract.methods.getVoterCap(validator, voter).call()
                await listVoters.push({
                    voter: voter,
                    epoch: epoch,
                    fromBlock: startBlock,
                    toBlock: endBlock,
                    masterNode: validator,
                    balance: new BigNumber(voterBalance).toString()
                })

                // Insert maximum 5k records in one time (Limited of mongodb is 100k)
                if (listVoters.length === 5000) {
                    await db.VoterValidator.insertMany(listVoters)
                    listVoters = []
                }
            })

            await Promise.all(voterMap)

            if (listVoters.length > 0) {
                await db.VoterValidator.insertMany(listVoters)
            }
        })
        await Promise.all(validatorMap)

        if (epoch > 1) {
            const q = require('./index')
            q.create('RewardValidatorProcess', { epoch: epoch })
                .priority('critical').removeOnComplete(true).save()
        }
    } catch (e) {
        console.error(consumer.name, e)
        done(e)
    }

    done()
}

module.exports = consumer
