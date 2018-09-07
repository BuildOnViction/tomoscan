'use strict'

import BlockHelper from '../helpers/block'
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
            return new Promise((resolve, reject) => {
                // TODO: Should handle on 'error'
                q.create('TransactionProcess', { hash: tx.toLowerCase(), timestamp: timestamp })
                    .priority('high').removeOnComplete(true).save().on('complete', () => {
                        return resolve()
                    })
            })
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
