'use strict'

const logger = require('../helpers/logger')
const db = require('../models')
const { blockSigner } = require('../helpers/tomo')
const BlockHelper = require('../helpers/block')
const config = require('config')

const consumer = {}
consumer.name = 'BlockSignerProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let startBlock = job.data.startBlock
    let endBlock = job.data.endBlock
    logger.info('Get block signer from block %s to %s', startBlock, endBlock)

    let numbers = []
    for (let i = startBlock; i <= endBlock; i++) {
        numbers.push(i)
    }
    try {
        let map = numbers.map(async function (number) {
            let block = await BlockHelper.getBlock(number)
            if (block) {
                let blockHash = block.hash
                let signers = await blockSigner.getSigners(blockHash)
                logger.info('Get signer of block %s', number)
                await db.BlockSigner.updateOne({
                    blockHash: blockHash,
                    blockNumber: number
                }, {
                    $set: {
                        blockHash: blockHash,
                        blockNumber: number,
                        signers: signers.map(signer => (signer || '').toLowerCase())
                    }
                }, { upsert: true })
            }
        })
        await Promise.all(map)

        if (parseInt(endBlock) % config.get('BLOCK_PER_EPOCH') === 0) {
            let q = require('./index')
            let epoch = parseInt(endBlock) / config.get('BLOCK_PER_EPOCH')
            q.create('UserHistoryProcess', { epoch: epoch })
                .priority('normal').removeOnComplete(true)
                .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
        }
        done()
    } catch (e) {
        logger.warn(e)
        done(e)
    }
}

module.exports = consumer
