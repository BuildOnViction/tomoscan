'use strict'

const TokenHolderHelper = require('../helpers/tokenHolder')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'TokenHolderProcess'
consumer.processNumber = 24
consumer.task = async function (job, done) {
    let token = JSON.parse(job.data.token)
    logger.info('Process token holder: %s %s %s', token.from, token.to, token.value)
    if (!token) {
        done()
        return false
    }

    try {
        // Add holder from.
        await TokenHolderHelper.updateQuality(token.from, token.address, -token.value)
        // Add holder to.
        await TokenHolderHelper.updateQuality(token.to, token.address, token.value)
    } catch (e) {
        logger.error(consumer.name, token, e)
        done(e)
    }

    done()
}

module.exports = consumer
