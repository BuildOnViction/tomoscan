'use strict'

import BlockHelper from '../helpers/block'
const config = require('config')
const emitter = require('../helpers/errorHandler')
const db = require('../models')

const consumer = {}
consumer.name = 'BlockProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let blockNumber = job.data.block
    try {
        console.log('Process block: ', blockNumber)
        let b = await BlockHelper.crawlBlock(blockNumber, (e) => {
            if (e) {
                throw e
            }
        })
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
            q.create('VoterProcess', { epoch: epoch })
                .priority('critical').removeOnComplete(true).save()
        }
    } catch (e) {
        db.Setting.updateOne({ meta_key: 'min_block_crawl' },
            { $set: {
                meta_value: parseInt(blockNumber) - 1 }
            }).then(() => {
            emitter.emit('error', e)
            done(e)
        }).catch(e => {
            emitter.emit('error', e)
            done(e)
        })
    }

    done()
}

module.exports = consumer
