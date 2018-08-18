'use strict'

import Web3Util from '../helpers/web3'
import TransactionHelper from '../helpers/transaction'

const db = require('../models')

const consumer = {}
consumer.name = 'TransactionProcess'
consumer.processNumber = 6
consumer.task = async function (job, done) {
    let hash = job.data.hash
    console.log('Process Transaction: ', hash)
    await TransactionHelper.getTxPending(hash)
    await TransactionHelper.getTxReceipt(hash)

    done()
}

module.exports = consumer
