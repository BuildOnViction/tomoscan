'use strict'

const TransactionHelper = require('../helpers/transaction')
const logger = require('../helpers/logger')
const db = require('../models')

const consumer = {}
consumer.name = 'TransactionProcess'
consumer.processNumber = 32
consumer.task = async function (job, done) {
    let blockNumber = job.data.blockNumber
    let txs = JSON.parse(job.data.txs.toLowerCase())
    let timestamp = job.data.timestamp

    let listTx = []
    await db.Tx.remove({ blockNumber: blockNumber })

    let map = txs.map(async function (hash) {
        let tx = await TransactionHelper.crawlTransaction(hash, timestamp)
        if (tx !== false) {
            listTx.push(tx)
        }
    })
    await Promise.all(map)
    try {
        if (listTx.length > 0) {
            logger.info('Insert %s tx of block %s', listTx.length, blockNumber)
            await db.Tx.insertMany(listTx)
        }
    } catch (e) {
        logger.warn('cannot insert list tx at block %s. Error %s', blockNumber, e)
        console.log(listTx)
    }

    done()
}

module.exports = consumer
