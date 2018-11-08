'use strict'

const BigNumber = require('bignumber.js')
const db = require('../models')
const config = require('config')

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
        let voteEpoch = await db.UserVoteAmount.find({ epoch: epoch, candidate: validator })
        let totalVoterCap = 0
        for (let i = 0; i < voteEpoch.length; i++) {
            totalVoterCap += voteEpoch[i].voteAmount
        }
        // console.log('total voter cap', totalVoterCap, validator)
        totalVoterCap = new BigNumber(totalVoterCap)

        let rewardVoter = []
        for (let i = 0; i < voteEpoch.length; i++) {
            let voterAddress = voteEpoch[i].voter
            let voterAmount = new BigNumber(voteEpoch[i].voteAmount)
            if (String(voterAmount) !== '0') {
                let reward = totalReward.multipliedBy(voterAmount).dividedBy(totalVoterCap)

                const q = require('./index')
                q.create('AddRewardToAccount', { address: voterAddress, balance: reward.toString() })
                    .priority('normal').removeOnComplete(true).save()

                await rewardVoter.push({
                    epoch: epoch,
                    startBlock: startBlock,
                    endBlock: endBlock,
                    address: voterAddress,
                    validator: validator,
                    reason: 'Voter',
                    lockBalance: voterAmount.toString(),
                    reward: reward.toString(),
                    rewardTime: rewardTime,
                    signNumber: validatorSignNumber
                })
                if (rewardVoter.length === 5000) {
                    await db.Reward.insertMany(rewardVoter)
                    rewardVoter = []
                }
            }
        }

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
