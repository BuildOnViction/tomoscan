'use strict'
const RewardHelper = require('../helpers/reward')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'RewardProcess'
consumer.processNumber = 1
consumer.task = async function (job) {
    const epoch = parseInt(job.epoch)
    logger.info('process get _rewards_ for epoch %s', epoch)
    try {
        const check = await RewardHelper.rewardOnChain(epoch)
        if (check) {
            return true
        } else {
            return false
        }
    } catch (e) {
        logger.warn('RewardProcess %s', e)
        return false
    }
}

module.exports = consumer
