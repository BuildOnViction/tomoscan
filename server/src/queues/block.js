const logger = require('../helpers/logger')
const BlockHelper = require('../helpers/block')
const config = require('config')
const db = require('../models')

const consumer = {}
consumer.name = 'BlockProcess'

consumer.task = async function (job) {
    const blockNumber = parseInt(job.block)
    const blockPerEpoch = parseInt(config.get('BLOCK_PER_EPOCH'))
    try {
        logger.info('Process block: %s', blockNumber)
        const b = await BlockHelper.crawlBlock(blockNumber)
        const Queue = require('./index')

        if (b) {
            // Begin from epoch 2
            const epoch = Math.floor(blockNumber / blockPerEpoch) - 1
            if ((blockNumber >= blockPerEpoch * 2) &&
                (blockNumber % blockPerEpoch === 50)) {
                logger.info('get _rewards_ at epoch %s (block %s)', epoch, blockNumber)
                Queue.newQueue('RewardProcess', { epoch: epoch })
            }
            if ((blockNumber >= blockPerEpoch * 2) &&
                (blockNumber % blockPerEpoch === 200)) {
                const checkExistOnDb = await db.Reward.find({ epoch: epoch }).limit(1)

                if (checkExistOnDb.length === 0) {
                    logger.info('re-get _rewards_ at epoch %s', epoch)
                    Queue.newQueue('RewardProcess', { epoch: epoch })
                }
            }
            if (blockNumber % 20 === 0) {
                Queue.newQueue('BlockFinalityProcess', {})
            }

            if (blockNumber > 15) {
                Queue.newQueue('BlockSignerProcess', { block: blockNumber - 15 })
            }

            const { txs, timestamp } = b
            if (txs.length <= 100) {
                Queue.newQueue('TransactionProcess', {
                    txs: JSON.stringify(txs),
                    timestamp: timestamp
                })
            } else {
                let listHash = []
                for (let i = 0; i < txs.length; i++) {
                    listHash.push(txs[i])
                    if (listHash.length === 100) {
                        Queue.newQueue('TransactionProcess', {
                            txs: JSON.stringify(txs),
                            timestamp: timestamp
                        })
                        listHash = []
                    }
                }
                if (listHash.length > 0) {
                    Queue.newQueue('TransactionProcess', {
                        txs: JSON.stringify(txs),
                        timestamp: timestamp
                    })
                }
            }
        }

        return true
    } catch (e) {
        logger.warn('Cannot crawl block %s. Sleep 2 seconds and re-crawl. Error %s', blockNumber, e)
        return false
    }
}

module.exports = consumer
