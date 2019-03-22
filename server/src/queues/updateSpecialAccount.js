'use strict'
// const config = require('config')
// const axios = require('axios')
const contractAddress = require('../contracts/contractAddress')
const db = require('../models')
const logger = require('../helpers/logger')
// const urlJoin = require('url-join')

const consumer = {}
consumer.name = 'updateSpecialAccount'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    try {
        logger.info('Count list transaction')
        await db.SpecialAccount.updateOne({ hash: 'allTransaction' }, {
            totalTransactionCount: await db.Tx.countDocuments({ isPending: false })
        }, { upsert: true })
        await db.SpecialAccount.updateOne({ hash: 'pendingTransaction' }, {
            totalTransactionCount: await db.Tx.countDocuments({ isPending: true })
        }, { upsert: true })
        await db.SpecialAccount.updateOne({ hash: 'signTransaction' }, {
            totalTransactionCount: await db.Tx.countDocuments({ to: contractAddress.BlockSigner, isPending: false })
        }, { upsert: true })
        await db.SpecialAccount.updateOne({ hash: 'otherTransaction' }, { totalTransactionCount:
                await db.Tx.countDocuments({ to: { $ne: contractAddress.BlockSigner }, isPending: false })
        }, { upsert: true })

        return done()
    } catch (e) {
        logger.warn('error when update special account. Error %s', e)
        return done(e)
    }
}

module.exports = consumer
