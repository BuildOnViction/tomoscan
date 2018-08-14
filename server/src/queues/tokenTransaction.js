'use strict'

import web3 from 'web3'
import { unformatAddress } from '../helpers/utils'
const db = require('../models')

const consumer = {}
consumer.name = 'TokenTransactionProcess'
consumer.processNumber = 6
consumer.task = async function (job, done) {
    let log = JSON.parse(job.data.log)
    console.log('Process token transaction: ')
    let _log = log
    if (typeof log.topics[1] === 'undefined' ||
        typeof log.topics[2] === 'undefined') {
        return false
    }

    if (log.topics[1]) {
        _log.from = unformatAddress(log.topics[1])
    }
    if (log.topics[2]) {
        _log.to = unformatAddress(log.topics[2])
    }
    _log.value = web3.utils.hexToNumberString(log.data)
    _log.valueNumber = _log.value
    // Find block by blockNumber.
    let block = await db.Block.findOne({ number: _log.blockNumber })
    if (block) {
        _log.block = block
    }
    _log.address = _log.address.toLowerCase()
    let transactionHash = _log.transactionHash.toLowerCase()

    delete _log['_id']

    let tokenTx = await db.TokenTx.findOneAndUpdate(
        { transactionHash: transactionHash, from: _log.from, to: _log.to },
        _log,
        { upsert: true, new: true })

    // Add token holder data.
    const q = require('./index')
    await q.create('TokenHolderProcess', { token: JSON.stringify({ from: _log.from, to: _log.to, address: _log.address, value: _log.value }) })
        .priority('normal').removeOnComplete(true).save()

    done()
}

module.exports = consumer
