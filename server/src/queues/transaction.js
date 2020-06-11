'use strict'

const TransactionHelper = require('../helpers/transaction')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'TransactionProcess'
consumer.processNumber = 8
consumer.task = async function (job) {
    const txs = JSON.parse(job.txs)
    const timestamp = job.timestamp

    const map = txs.map(async function (hash) {
        logger.info('Process Transaction: %s', hash)
        try {
            await TransactionHelper.crawlTransaction(hash, timestamp)
        } catch (e) {
            return false
        }
    })
    await Promise.all(map)

    return true
}

module.exports = consumer
