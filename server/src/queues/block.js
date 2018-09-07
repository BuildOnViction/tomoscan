'use strict'

import BlockHelper from '../helpers/block'
import TransactionHelper from '../helpers/transaction'
const config = require('config')

const consumer = {}
consumer.name = 'BlockProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let blockNumber = job.data.block
    console.log('Process block: ', blockNumber)
    let b = await BlockHelper.crawlBlock(blockNumber)
    const q = require('./index')

    if (b) {
        let { txs, timestamp } = b
        let map = txs.map(tx => {
            console.log('Process Transaction: ', tx)
            return TransactionHelper.crawlTransaction(tx, timestamp)
        })
        await Promise.all(map)
    }

    if (parseInt(blockNumber) % config.get('BLOCK_PER_EPOCH') === 0) {
        let epoch = parseInt(blockNumber) / config.get('BLOCK_PER_EPOCH')
        q.create('VoterProcess', { epoch: epoch })
            .priority('critical').removeOnComplete(true).save()
    }

    done()
}

module.exports = consumer
