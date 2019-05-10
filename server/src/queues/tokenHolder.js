'use strict'

const TokenHolderHelper = require('../helpers/tokenHolder')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'TokenHolderProcess'
consumer.processNumber = 2
consumer.task = async function (job, done) {
    try {
        let token = JSON.parse(job.data.token)
        logger.info('Process token holder: %s %s %s', token.from, token.to, token.value)
        if (!token) {
            return done()
        }
        // Add holder from.
        await TokenHolderHelper.updateQuality(token.from, token.address, -token.value)
        // Add holder to.
        await TokenHolderHelper.updateQuality(token.to, token.address, token.value)
    } catch (e) {
        logger.warn('Error TokenHolderProcess %s', e)
        return done(e)
    }

    return done()
}

module.exports = consumer
