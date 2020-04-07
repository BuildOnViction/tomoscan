'use strict'

const db = require('../models')
const logger = require('../helpers/logger')
const TransactionHelper = require('../helpers/transaction')

const consumer = {}
consumer.name = 'TransactionPendingProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    const txes = await db.Tx.find({ isPending: true })
        .sort({ timestamp: 1 }).limit(100)
    logger.info('Update %s tx pending', txes.length)
    try {
        const map = txes.map(async function (tx) {
            if (tx.status === true) {
                tx.isPending = false
            } else {
                const t = await TransactionHelper.getTransactionReceipt(tx.hash, true)
                if (t) {
                    tx.status = true
                    tx.isPending = false
                } else {
                    tx.status = false
                    tx.isPending = false
                }
            }
            tx.save()
        })
        await Promise.all(map)
        return done()
    } catch (e) {
        logger.warn(e)
        return done(e)
    }
}

module.exports = consumer
