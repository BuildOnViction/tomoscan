'use strict'

const BigNumber = require('bignumber.js')
const db = require('../models')
const config = require('config')
const logger = require('../helpers/logger')

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
    logger.info('Process reward for voter of validator %s at epoch %s', validator, epoch)

    let endBlock = parseInt(epoch) * config.get('BLOCK_PER_EPOCH')
    let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1

    try {
        let voteEpoch = await db.UserVoteAmount.find({ epoch: epoch, candidate: validator })
        let totalVoterCap = 0
        for (let i = 0; i < voteEpoch.length; i++) {
            totalVoterCap += voteEpoch[i].voteAmount
        }
        totalVoterCap = new BigNumber(totalVoterCap)

        let rewardVoter = []
        for (let i = 0; i < voteEpoch.length; i++) {
            let voterAddress = voteEpoch[i].voter
            let voterAmount = new BigNumber(voteEpoch[i].voteAmount)
            if (String(voterAmount) !== '0') {
                let reward = totalReward.multipliedBy(voterAmount).dividedBy(totalVoterCap)

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
        logger.warn(e)
        done(e)
    }

    done()
}

module.exports = consumer
