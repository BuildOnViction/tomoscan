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

        logger.info('count tx for tomochain contract')
        let tomochainContract = []
        for (let c in contractAddress) {
            tomochainContract.push(contractAddress[c])
        }
        for (let i = 0; i < tomochainContract.length; i++) {
            let hash = tomochainContract[i]
            let outTxCount = await db.Tx.countDocuments({ from: hash })
            let inTxCount = await db.Tx.countDocuments({ to: hash })
            let contractTxCount = await db.Tx.countDocuments({ contractAddress: hash })
            let totalTxCount = inTxCount + outTxCount + contractTxCount
            let logCount = await db.Log.countDocuments({ address: hash })
            await db.SpecialAccount.updateOne({ hash: hash }, {
                inTransactionCount: inTxCount,
                outTransactionCount: outTxCount,
                totalTransactionCount: totalTxCount,
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
