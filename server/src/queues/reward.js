'use strict'
const RewardHelper = require('../helpers/reward')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'RewardProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    const epoch = parseInt(job.data.epoch)
    logger.info('process get _rewards_ for epoch %s attempts %s', epoch, job.toJSON().attempts.made)
    try {
        const check = await RewardHelper.rewardOnChain(epoch)
        if (check) {
            return done()
        } else {
            if (job.toJSON().attempts.made === 4) {
                logger.error('Attempts 5 times, can not _rewards_ calculate %s', epoch)
                return done()
            } else {
                return done(new Error('There is a problem'))
            }
        }
    } catch (e) {
        logger.warn('RewardProcess %s', e)
        if (job.toJSON().attempts.made === 4) {
            logger.error('Attempts 5 times, can not _rewards_ calculate %s', epoch)
        }
        return done(e)
    }
}

module.exports = consumer
