'use strict'

const TokenHolderHelper = require('../helpers/tokenHolder')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'TokenHolderProcess'
consumer.processNumber = 2
consumer.task = async function (job, done) {
    try {
        let token = JSON.parse(job.data.token)
        logger.info(`Transfer ${token.value} token ${token.address} from ${token.from} to ${token.to}`)
        if (!token) {
            return done()
        }
        // Add holder from.
        await TokenHolderHelper.updateQuality(token.from, token.address)
        // Add holder to.
        await TokenHolderHelper.updateQuality(token.to, token.address)
    } catch (e) {
        logger.warn('Error TokenHolderProcess %s', e)
        return done(e)
    }

    return done()
}

module.exports = consumer
