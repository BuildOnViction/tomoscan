'use strict'

const BlockHelper = require('../helpers/block')
const config = require('config')
const emitter = require('../helpers/errorHandler')

const consumer = {}
consumer.name = 'BlockProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let blockNumber = job.data.block
    try {
        console.log('Process block: ', blockNumber, new Date())
        let b = await BlockHelper.crawlBlock(blockNumber)
        const q = require('./index')

        if (b) {
            let { txs, timestamp } = b
            let map = txs.map(tx => {
                return new Promise((resolve, reject) => {
                    q.create('TransactionProcess', { hash: tx.toLowerCase(), timestamp: timestamp })
                        .priority('high').removeOnComplete(true).save().on('complete', () => {
                            return resolve()
                        }).on('error', (e) => {
                            return reject(e)
                        })
                })
            })
            await Promise.all(map).catch(e => {
                throw e
            })
        }

        if (parseInt(blockNumber) % config.get('BLOCK_PER_EPOCH') === 0) {
            let epoch = parseInt(blockNumber) / config.get('BLOCK_PER_EPOCH')
            q.create('UserHistoryProcess', { epoch: epoch - 1 })
                .priority('normal').removeOnComplete(true).save()
        }

        if (parseInt(blockNumber) % 100 === 0) {
            let endBlock = parseInt(blockNumber) - config.get('BLOCK_PER_EPOCH')
            let startBlock = endBlock - 100 + 1
            q.create('BlockSignerProcess', { startBlock: startBlock, endBlock: endBlock })
                .priority('normal').removeOnComplete(true).save()
        }

        done()
    } catch (e) {
        let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
        await sleep(2000)
        done()
        return emitter.emit('errorCrawlBlock', e, blockNumber)
    }
}

module.exports = consumer
