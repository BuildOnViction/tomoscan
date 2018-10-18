'use strict'

const Web3Util = require('../helpers/web3')
const BigNumber = require('bignumber.js')

const db = require('../models')
const config = require('config')

const TomoValidatorABI = require('../contracts/abi/TomoValidator')
const contractAddress = require('../contracts/contractAddress')

const consumer = {}
consumer.name = 'RewardVoterProcess'
consumer.processNumber = 4
consumer.task = async function (job, done) {
    let epoch = job.data.epoch
    let validator = job.data.validator.toLowerCase()
    let validatorSignNumber = job.data.validatorSignNumber
    let totalReward = job.data.totalReward
    let rewardTime = job.data.rewardTime
    if (!rewardTime) {
        rewardTime = new Date()
    }
    totalReward = new BigNumber(totalReward)
    console.log('Process reward for voter of validator', validator, ' at epoch: ', epoch)

    let endBlock = parseInt(epoch) * config.get('BLOCK_PER_EPOCH')
    let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1

    try {
        let web3 = await Web3Util.getWeb3()
        let validatorContract = await new web3.eth.Contract(TomoValidatorABI, contractAddress.TomoValidator)

        let voters = await validatorContract.methods.getVoters(validator).call()

        let totalVoterCap = await validatorContract.methods.getCandidateCap(validator).call()
        totalVoterCap = new BigNumber(totalVoterCap)
        let listVoters = []
        let voterMap = voters.map(async (voter) => {
            voter = voter.toString().toLowerCase()
            let voterCap = await validatorContract.methods.getVoterCap(validator, voter).call()
            voterCap = new BigNumber(voterCap)
            listVoters.push({
                address: voter,
                balance: voterCap
            })
        })
        await Promise.all(voterMap)

        let rewardVoter = []
        const q = require('./index')

        let listVoterMap = listVoters.map(async (voter) => {
            if (voter.balance.toString() !== '0') {
                let voterAddress = voter.address.toString().toLowerCase()
                let reward = totalReward.multipliedBy(voter.balance).dividedBy(totalVoterCap)
                q.create('AddRewardToAccount', {
                    address: voterAddress,
                    balance: reward.toString()
                })
                    .priority('normal').removeOnComplete(true).save()

                await rewardVoter.push({
                    epoch: epoch,
                    startBlock: startBlock,
                    endBlock: endBlock,
                    address: voterAddress,
                    validator: validator,
                    reason: 'Voter',
                    lockBalance: voter.balance.toString(),
                    reward: reward.toString(),
                    rewardTime: rewardTime,
                    signNumber: validatorSignNumber
                })
            }

            if (rewardVoter.length === 5000) {
                await db.Reward.insertMany(rewardVoter)
                rewardVoter = []
            }
        })
        await Promise.all(listVoterMap)
        if (rewardVoter.length > 0) {
            await db.Reward.insertMany(rewardVoter)
        }
    } catch (e) {
        console.error(consumer.name, e)
        done(e)
    }

    done()
}

module.exports = consumer
