'use strict'

const logger = require('../helpers/logger')
const BlockHelper = require('../helpers/block')
const config = require('config')
const emitter = require('../helpers/errorHandler')

const consumer = {}
consumer.name = 'BlockProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let blockNumber = parseInt(job.data.block)
    try {
        logger.info('Process block: %s at %s', blockNumber, new Date())
        let b = await BlockHelper.crawlBlock(blockNumber)
        const q = require('./index')

        if (b) {
            let { txs, timestamp } = b
            let listHash = []
            for (let i = 0; i < txs.length; i++) {
                listHash.push(txs[i])
                if (listHash.length === 500) {
                    q.create('TransactionProcess', { txs: JSON.stringify(listHash), timestamp: timestamp })
                        .priority('high').removeOnComplete(true)
                        .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
                    listHash = []
                }
            }
            if (listHash.length > 0) {
                q.create('TransactionProcess', { txs: JSON.stringify(txs), timestamp: timestamp })
                    .priority('high').removeOnComplete(true)
                    .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
            }
        }

        // Begin from epoch 2
        if ((blockNumber >= config.get('BLOCK_PER_EPOCH') * 2) && (blockNumber % config.get('BLOCK_PER_EPOCH') === 0)) {
            let endBlock = blockNumber - config.get('BLOCK_PER_EPOCH')
            let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1
            q.create('BlockSignerProcess', { startBlock: startBlock, endBlock: endBlock })
                .priority('normal').removeOnComplete(true)
                .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
        }
        if (blockNumber % 20 === 0) {
            q.create('BlockFinalityProcess', {})
                .priority('normal').removeOnComplete(true)
                .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
        }

        if (blockNumber % 100 === 0) {
            q.create('updateSpecialAccount', {})
                .priority('normal').removeOnComplete(true)
                .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
        }

        done()
    } catch (e) {
        logger.warn(e)
        logger.warn('Cannot crawl block %s. Sleep 2 seconds and re-crawl', blockNumber)
        let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
        await sleep(2000)
        done(e)
        return emitter.emit('errorCrawlBlock', e, blockNumber)
    }
}

module.exports = consumer
