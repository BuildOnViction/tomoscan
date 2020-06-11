'use strict'
const logger = require('../helpers/logger')
const AccountHelper = require('../helpers/account')

const consumer = {}
consumer.name = 'AccountProcess'
consumer.processNumber = 4
consumer.task = async function (job) {
    const listHash = JSON.parse(job.listHash)
    const map = listHash.map(async function (hash) {
        hash = hash.toLowerCase()
        logger.info('Process account: %s', hash)

        try {
            await AccountHelper.processAccount(hash)
        } catch (e) {
            logger.warn('Cannot process account %s. Error %s', hash, e)
            return false
        }
    })
    await Promise.all(map)

    return true
}

module.exports = consumer
