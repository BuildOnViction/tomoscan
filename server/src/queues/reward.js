'use strict'
const RewardHelper = require('../helpers/reward')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'RewardProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let epoch = parseInt(job.data.epoch)
    logger.info('Reward calculate for epoch %s attempts %s', epoch, job.toJSON().attempts.made)
    try {
        let check = await RewardHelper.rewardOnChain(epoch)
        if (check) {
            return done()
        } else {
            if (job.toJSON().attempts.made === 4) {
                logger.error('Attempts 5 times, can not reward calculate %s', epoch)
                return done()
            } else {
                return done(new Error('There is a problem'))
            }
        }
    } catch (e) {
        logger.warn('RewardProcess %s', e)
        if (job.toJSON().attempts.made === 4) {
            logger.error('Attempts 5 times, can not reward calculate %s', epoch)
        }
        return done(e)
    }
}

module.exports = consumer
