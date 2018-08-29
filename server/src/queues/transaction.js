'use strict'

import TransactionHelper from '../helpers/transaction'

const consumer = {}
consumer.name = 'TransactionProcess'
consumer.processNumber = 6
consumer.task = async function (job, done) {
    let hash = job.data.hash.toLowerCase()
    let timestamp = job.data.timestamp
    console.log('Process Transaction: ', hash)
    await TransactionHelper.crawlTransaction(hash, timestamp)

    done()
}

module.exports = consumer
