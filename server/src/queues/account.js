'use strict'
const logger = require('../helpers/logger')
const AccountHelper = require('../helpers/account')

const consumer = {}
consumer.name = 'AccountProcess'
consumer.processNumber = 24
consumer.task = async function (job, done) {
    let hash = job.data.address.toLowerCase()
    logger.info('Process account: %s', hash)

    try {
        await AccountHelper.processAccount(hash)
    } catch (e) {
        return done(e)
    }

    return done()
}

module.exports = consumer
