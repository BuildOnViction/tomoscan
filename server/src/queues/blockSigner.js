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
    logger.info('Get block signer from block %s to %s attempts %s', startBlock, endBlock, job.toJSON().attempts.made)

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

        let q = require('./index')
        let epoch = parseInt(endBlock) / config.get('BLOCK_PER_EPOCH')
        q.create('UserHistoryProcess', { epoch: epoch })
            .priority('normal').removeOnComplete(true)
            .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
        done()
    } catch (e) {
        logger.warn('BlockSignerProcess %s', e)
        if (job.toJSON().attempts.made === 4) {
            logger.error('Attempts 5 times, can not BlockSignerProcess %s %s', startBlock, endBlock)
        }
        done(e)
    }
}

module.exports = consumer
