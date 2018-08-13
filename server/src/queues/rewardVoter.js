'use strict'

const db = require('../models')
const config = require('config')
import Web3Util from '../helpers/web3'

const TomoValidatorABI = require('../contracts/abi/TomoValidator')
const contractAddress = require('../contracts/contractAddress')

const consumer = {}
consumer.name = 'RewardVoterProcess'
consumer.processNumber = 4
consumer.task = async function(job, done) {
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
    await voters.forEach(async (voter) => {
        let voterCap = await validatorContract.methods.getVoterCap(validator, voter).call()
        totalVoterCap += parseFloat(voterCap)
        listVoters.push({
            address: voter,
            balance: voterCap
        })
    })

    let rewardVoter = []

    await listVoters.forEach(async (voter) => {
        let reward = ((reward4voter * voter.balance) / totalVoterCap) * (validatorSignNumber / totalSignNumber)

        await q.create('AddRewardToAccount', {
            address: voter.address,
            balance: reward
        })
            .priority('normal').removeOnComplete(true).save()

        let lockBalance = await validatorContract.methods.getVoterCap(validator).call()
        rewardVoter.push({
            address: voter,
            masterNode: validator,
            voteBalance: lockBalance,
            reward: reward
        })
    })
    await db.Reward.update({epoch: epoch}, {reward: {$set: {voter: rewardVoter}}})

    done()
}

module.exports = consumer
