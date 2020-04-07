'use strict'

const TransactionHelper = require('../helpers/transaction')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'TransactionProcess'
consumer.processNumber = 8
consumer.task = async function (job, done) {
    const txs = JSON.parse(job.data.txs.toLowerCase())
    const timestamp = job.data.timestamp

    const map = txs.map(async function (hash) {
        logger.info('Process Transaction: %s', hash)
        try {
            await TransactionHelper.crawlTransaction(hash, timestamp)
        } catch (e) {
            return done(e)
        }
    })
    await Promise.all(map)

    return done()
}

module.exports = consumer
