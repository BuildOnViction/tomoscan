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
            transactionCount: await db.Tx.countDocuments({ isPending: false })
        }, { upsert: true })
        await db.SpecialAccount.updateOne({ hash: 'pendingTransaction' }, {
            transactionCount: await db.Tx.countDocuments({ isPending: true })
        }, { upsert: true })
        await db.SpecialAccount.updateOne({ hash: 'signTransaction' }, {
            transactionCount: await db.Tx.countDocuments({ to: contractAddress.BlockSigner, isPending: false })
        }, { upsert: true })
        await db.SpecialAccount.updateOne({ hash: 'otherTransaction' }, {
            transactionCount: await db.Tx.countDocuments({ to: { $ne: contractAddress.BlockSigner }, isPending: false })
        }, { upsert: true })

        logger.info('count tx for tomochain contract')
        let tomochainContract = []
        for (let c in contractAddress) {
            tomochainContract.push(contractAddress[c])
        }
        for (let i = 0; i < tomochainContract.length; i++) {
            let hash = tomochainContract[i]
            let txCount = await db.Tx.countDocuments({ from: hash, isPending: false })
            txCount += await db.Tx.countDocuments({ to: hash, isPending: false })
            txCount += await db.Tx.countDocuments({ contractAddress: hash, isPending: false })
            let logCount = await db.Log.countDocuments({ address: hash })
            await db.SpecialAccount.updateOne({ hash: hash }, {
                transactionCount: txCount,
                logCount: logCount
            }, { upsert: true })
        }

        done()
    } catch (e) {
        logger.warn('error when update special account. Error %s', e)
        done(e)
    }
}

module.exports = consumer
