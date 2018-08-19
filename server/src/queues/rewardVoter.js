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
    let totalReward = job.data.totalReward
    console.log('Process reward for voter at epoch: ', epoch)

    let endBlock = parseInt(epoch) * config.get('BLOCK_PER_EPOCH')
    let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1

    let reward4voter = config.get('REWARD') * 10 ** 18 * config.get('VOTER_REWARD_PERCENT') / 100

    let web3 = await Web3Util.getWeb3()
    let validatorContract = await new web3.eth.Contract(TomoValidatorABI, contractAddress.TomoValidator)

    let voters = await validatorContract.methods.getVoters(validator).call()

    let totalVoterCap = 0
    let listVoters = []
    let voterMap = voters.map(async (voter) => {
        voter = voter.toString().toLowerCase()
        let voterCap = await validatorContract.methods.getVoterCap(validator, voter).call()
        totalVoterCap += parseFloat(voterCap)
        listVoters.push({
            address: voter,
            balance: voterCap
        })
    })
    await Promise.all(voterMap)

    let rewardVoter = []
    const q = require('./index')

    let listVoterMap = listVoters.map(async (voter) => {
        let voterAddress = voter.address.toString().toLowerCase()
        let reward = ((reward4voter * voter.balance) / totalVoterCap) * totalReward

        q.create('AddRewardToAccount', {
            address: voterAddress,
            balance: reward
        })
            .priority('normal').removeOnComplete(true).save()

        let lockBalance = await validatorContract.methods.getVoterCap(validator, voterAddress).call()

        await rewardVoter.push({
            epoch: epoch,
            startBlock: startBlock,
            endBlock: endBlock,
            address: voterAddress,
            validator: validator,
            reason: 'Voter',
            lockBalance: lockBalance.toString(),
            reward: reward.toString(),
            signNumber: validatorSignNumber
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
