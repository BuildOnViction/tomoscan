'use strict'

import Web3Util from '../helpers/web3'

const db = require('../models')
const config = require('config')

const TomoValidatorABI = require('../contracts/abi/TomoValidator')
const contractAddress = require('../contracts/contractAddress')

const consumer = {}
consumer.name = 'RewardVoterProcess'
consumer.processNumber = 4
consumer.task = async function (job, done) {
    let epoch = job.data.epoch
    let validator = job.data.validator
    let validatorSignNumber = job.data.validatorSignNumber
    let totalSignNumber = job.data.totalSignNumber
    console.log('Process reward at epoch: ', epoch)

    let endBlock = parseInt(epoch) * config.get('BLOCK_PER_EPOCH')
    let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1

    let reward4voter = config.get('REWARD') * config.get('VOTER_REWARD_PERCENT')

    let web3 = await Web3Util.getWeb3()
    let validatorContract = await new web3.eth.Contract(TomoValidatorABI, contractAddress.TomoValidator)

    let voters = await validatorContract.methods.getVoters(validator).call()

    let totalVoterCap = 0
    let listVoters = []
    let voterMap = voters.map(async (voter) => {
        let voterCap = await validatorContract.methods.getVoterCap(validator, voter).call()
        totalVoterCap += parseFloat(voterCap)
        listVoters.push({
            address: voter.toLowerCase(),
            balance: voterCap
        })
    })
    await Promise.all(voterMap)

    let rewardVoter = []
    const q = require('./index')

    let listVoterMap = listVoters.map(async (voter) => {
        let reward = ((reward4voter * voter.balance) / totalVoterCap) * (validatorSignNumber / totalSignNumber)

        await q.create('AddRewardToAccount', {
            address: voter.address.toLowerCase(),
            balance: reward
        })
            .priority('normal').removeOnComplete(true).save()

        let lockBalance = await validatorContract.methods.getVoterCap(validator, voter.address.toLowerCase()).call()

        await rewardVoter.push({
            epoch: epoch,
            startBlock: startBlock,
            endBlock: endBlock,
            address: voter.address.toLowerCase(),
            isMasterNode: false,
            lockBalance: lockBalance,
            reward: reward,
            numberBlockSigner: validatorSignNumber
        })

        if (rewardVoter.length === 5000) {
            await db.Reward.insertMany(rewardVoter)
            rewardVoter = []
        }
    })
    await Promise.all(listVoterMap)
    if (rewardVoter.length > 0) {
        await db.Reward.insertMany(rewardVoter)
    }

    done()
}

module.exports = consumer
