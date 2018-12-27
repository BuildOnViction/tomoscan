'use strict'

const TransactionHelper = require('../helpers/transaction')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'TransactionProcess'
consumer.processNumber = 32
consumer.task = async function (job, done) {
    let txs = JSON.parse(job.data.txs.toLowerCase())
    let timestamp = job.data.timestamp

    let map = txs.map(async function (hash) {
        logger.info('Process Transaction: %s', hash)
        try {
            await TransactionHelper.crawlTransaction(hash, timestamp)
        } catch (e) {
            done(e)
        }
    })
    await Promise.all(map)

    done()
}

module.exports = consumer
