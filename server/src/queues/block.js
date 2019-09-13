'use strict'

const logger = require('../helpers/logger')
const BlockHelper = require('../helpers/block')
const config = require('config')

const consumer = {}
consumer.name = 'BlockProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let blockNumber = parseInt(job.data.block)
    try {
        logger.info('Process block: %s attempts %s', blockNumber, job.toJSON().attempts.made)
        let b = await BlockHelper.crawlBlock(blockNumber)
        const q = require('./index')

        if (b) {
            // Begin from epoch 2
            if ((blockNumber >= config.get('BLOCK_PER_EPOCH') * 2) &&
                (blockNumber % config.get('BLOCK_PER_EPOCH') === 10)) {
                let epoch = (blockNumber / config.get('BLOCK_PER_EPOCH')) - 1
                q.create('RewardProcess', { epoch: epoch })
                    .priority('normal').removeOnComplete(true)
                    .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
            }
            if (blockNumber % 20 === 0) {
                q.create('BlockFinalityProcess', {})
                    .priority('normal').removeOnComplete(true)
                    .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
            }

            if (blockNumber > 15) {
                q.create('BlockSignerProcess', { block: blockNumber - 15 })
                    .priority('normal').removeOnComplete(true)
                    .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
            }

            let { txs, timestamp, signer } = b
            if (txs.length <= 100) {
                q.create('TransactionProcess', {
                    txs: JSON.stringify(txs),
                    timestamp: timestamp
                })
                    .priority('high').removeOnComplete(true)
                    .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
            } else {
                let listHash = []
                for (let i = 0; i < txs.length; i++) {
                    listHash.push(txs[i])
                    if (listHash.length === 100) {
                        q.create('TransactionProcess', {
                            txs: JSON.stringify(listHash),
                            timestamp: timestamp
                        })
                            .priority('high').removeOnComplete(true)
                            .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
                        listHash = []
                    }
                }
                if (listHash.length > 0) {
                    q.create('TransactionProcess', {
                        txs: JSON.stringify(txs),
                        timestamp: timestamp
                    })
                        .priority('high').removeOnComplete(true)
                        .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
                }
            }

            q.create('CountProcess', { data: JSON.stringify([{ hash: signer, countType: 'mined' }]) })
                .priority('low').removeOnComplete(true)
                .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
        }
        // if (blockNumber % 5 === 0) {
        //     q.create('TransactionPendingProcess', {})
        //         .priority('normal').removeOnComplete(true)
        //         .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
        // }

        return done()
    } catch (e) {
        logger.warn('Cannot crawl block %s. Sleep 2 seconds and re-crawl. Error %s', blockNumber, e)
        if (job.toJSON().attempts.made === 4) {
            logger.error('Attempts 5 times, can not crawl block %s', blockNumber)
        }
        return done(e)
    }
}

module.exports = consumer
