'use strict'

const logger = require('../helpers/logger')
const BlockHelper = require('../helpers/block')
const config = require('config')
const db = require('../models')

const consumer = {}
consumer.name = 'BlockProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    const blockNumber = parseInt(job.data.block)
    const blockPerEpoch = parseInt(config.get('BLOCK_PER_EPOCH'))
    try {
        logger.info('Process block: %s attempts %s', blockNumber, job.toJSON().attempts.made)
        const b = await BlockHelper.crawlBlock(blockNumber)
        const q = require('./index')

        if (b) {
            // Begin from epoch 2
            const epoch = Math.floor(blockNumber / blockPerEpoch) - 1
            if ((blockNumber >= blockPerEpoch * 2) &&
                (blockNumber % blockPerEpoch === 50)) {
                logger.info('get _rewards_ at epoch %s (block %s)', epoch, blockNumber)
                q.create('RewardProcess', { epoch: epoch })
                    .priority('normal').removeOnComplete(true)
                    .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
            }
            if ((blockNumber >= blockPerEpoch * 2) &&
                (blockNumber % blockPerEpoch === 200)) {
                const checkExistOnDb = await db.Reward.find({ epoch: epoch }).limit(1)

                if (checkExistOnDb.length === 0) {
                    logger.info('re-get _rewards_ at epoch %s', epoch)
                    q.create('RewardProcess', { epoch: epoch })
                        .priority('normal').removeOnComplete(true)
                        .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
                }
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

            const { txs, timestamp } = b
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
