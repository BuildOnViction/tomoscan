'use strict'

const TokenHolderHelper = require('../helpers/tokenHolder')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'TokenHolderProcess'
consumer.processNumber = 2
consumer.task = async function (job, done) {
    try {
        const token = JSON.parse(job.data.token)
        logger.info(`Transfer ${token.value} token ${token.address} from ${token.from} to ${token.to}`)
        if (!token) {
            return done()
        }
        // Add holder from.
        if (token.from !== '0x0000000000000000000000000000000000000000') {
            await TokenHolderHelper.updateQuality(token.from, token.address)
        }
        // Add holder to.
        if (token.to !== '0x0000000000000000000000000000000000000000') {
            await TokenHolderHelper.updateQuality(token.to, token.address)
        }
    } catch (e) {
        logger.warn('Error TokenHolderProcess %s', e)
        return done(e)
    }

    return done()
}

module.exports = consumer
