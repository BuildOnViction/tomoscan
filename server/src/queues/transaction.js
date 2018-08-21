'use strict'

import TransactionHelper from '../helpers/transaction'

const consumer = {}
consumer.name = 'TransactionProcess'
consumer.processNumber = 6
consumer.task = async function (job, done) {
    let hash = job.data.hash.toLowerCase()
    console.log('Process Transaction: ', hash)
    await TransactionHelper.getTxPending(hash)
    await TransactionHelper.getTxReceipt(hash)

    done()
}

module.exports = consumer
