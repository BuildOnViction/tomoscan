'use strict'
const config = require('config')
const axios = require('axios')
const contractAddress = require('../contracts/contractAddress')
const db = require('../models')

const consumer = {}
consumer.name = 'updateSpecialAccount'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    try {
        console.info('Count list transaction')
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

        const tomomasterUrl = config.get('TOMOMASTER_API_URL')
        const candidates = await axios.get(tomomasterUrl + '/api/candidates')
        console.info('there are %s candidates need process', candidates.data.length)
        let map1 = candidates.data.map(async (candidate) => {
            let hash = candidate.candidate.toLowerCase()

            console.info('process candidate', hash)
            let txCount = await db.Tx.countDocuments({ $or: [{ from: hash }, { to: hash }] })
            let minedBlock = await db.Block.countDocuments({ signer: hash })
            let rewardCount = await db.Reward.countDocuments({ address: hash })
            let logCount = await db.Log.countDocuments({ address: hash })
            await db.SpecialAccount.updateOne({ hash: hash }, {
                transactionCount: txCount,
                minedBlock: minedBlock,
                rewardCount: rewardCount,
                logCount: logCount
            }, { upsert: true })

            let owner = candidate.owner.toLowerCase()
            let txCountOwner = await db.Tx.countDocuments({ $or: [{ from: owner }, { to: owner }] })
            let minedBlockOwner = await db.Block.countDocuments({ signer: owner })
            let rewardCountOwner = await db.Reward.countDocuments({ address: owner })
            let logCountOwner = await db.Log.countDocuments({ address: owner })
            await db.SpecialAccount.updateOne({ hash: owner }, {
                transactionCount: txCountOwner,
                minedBlock: minedBlockOwner,
                rewardCount: rewardCountOwner,
                logCount: logCountOwner
            }, { upsert: true })
        })
        await Promise.all(map1)

        let accounts = await db.Account.find({ isContract: true })
        console.info('there are %s contract accounts', accounts.length)
        let map2 = accounts.map(async (acc) => {
            let hash = acc.hash.toLowerCase()
            let txCount = await db.Tx.countDocuments({ from: hash })
            txCount += await db.Tx.countDocuments({ to: hash })
            txCount += await db.Tx.countDocuments({ contractAddress: hash })
            let logCount = await db.Log.countDocuments({ address: hash })
            await db.SpecialAccount.updateOne({ hash: hash }, {
                transactionCount: txCount,
                logCount: logCount
            }, { upsert: true })
        })
        await Promise.all(map2)
        done()
    } catch (e) {
        console.error(e)
        done(e)
    }
}

module.exports = consumer
