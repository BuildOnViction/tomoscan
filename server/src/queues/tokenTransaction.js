'use strict'

import web3 from 'web3'
const utils = require('../helpers/utils')
const db = require('../models')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'TokenTransactionProcess'
consumer.processNumber = 12
consumer.task = async function (job, done) {
    try {
        let log = JSON.parse(job.data.log)
        logger.info('Process token transaction: ')
        let _log = log
        if (typeof log.topics[1] === 'undefined' ||
            typeof log.topics[2] === 'undefined') {
            done()
            return false
        }

        if (log.topics[1]) {
            _log.from = await utils.unformatAddress(log.topics[1])
        }
        if (log.topics[2]) {
            _log.to = await utils.unformatAddress(log.topics[2])
        }
        _log.value = web3.utils.hexToNumberString(log.data)
        _log.valueNumber = _log.value
        _log.address = _log.address.toLowerCase()
        let transactionHash = _log.transactionHash.toLowerCase()

        delete _log['_id']

        await db.TokenTx.updateOne(
            { transactionHash: transactionHash, from: _log.from, to: _log.to },
            _log,
            { upsert: true, new: true })

        // Add token holder data.
        const q = require('./index')
        q.create('TokenHolderProcess', { token: JSON.stringify({
            from: _log.from.toLowerCase(),
            to: _log.to.toLowerCase(),
            address: _log.address,
            value: _log.value
        }) })
            .priority('normal').removeOnComplete(true)
            .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
    } catch (e) {
        logger.warn(e)
        done(e)
    }

    done()
}

module.exports = consumer
