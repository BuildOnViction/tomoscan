'use strict'
const config = require('config')
const axios = require('axios')
const db = require('../models')
const logger = require('../helpers/logger')
const urlJoin = require('url-join')

const consumer = {}
consumer.name = 'updateCandidateTxCount'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    try {
        const tomomasterUrl = config.get('TOMOMASTER_API_URL')
        const candidates = await axios.get(urlJoin(tomomasterUrl, '/api/candidates'))
        logger.info('there are %s candidates need process', candidates.data.length)
        let listCan = candidates.data
        for (let i = 0; i < listCan.length; i++) {
            let hash = listCan[i].candidate.toLowerCase()

            logger.info('process candidate %s', hash)
            let txCount = await db.Tx.countDocuments({ $or: [{ from: hash }, { to: hash }], isPending: false })
            let minedBlock = await db.Block.countDocuments({ signer: hash })
            let rewardCount = await db.Reward.countDocuments({ address: hash })
            let logCount = await db.Log.countDocuments({ address: hash })
            await db.SpecialAccount.updateOne({ hash: hash }, {
                transactionCount: txCount,
                minedBlock: minedBlock,
                rewardCount: rewardCount,
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
