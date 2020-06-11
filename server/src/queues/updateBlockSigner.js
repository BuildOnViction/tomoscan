'use strict'

const db = require('../models')
const logger = require('../helpers/logger')
const axios = require('axios')
const config = require('config')
const BlockHelper = require('../helpers/block')

const consumer = {}
consumer.name = 'BlockSignerProcess'
consumer.processNumber = 1

consumer.task = async function (job) {
    const blockNumber = parseInt(job.block)
    let block = await db.Block.findOne({ number: blockNumber })
    if (!block) {
        block = await BlockHelper.getBlock(blockNumber)
    }
    if (block) {
        logger.info('Update signers for block %s %s', block.number, block.hash)
        try {
            try {
                const data = {
                    jsonrpc: '2.0',
                    method: 'eth_getBlockSignersByHash',
                    params: [block.hash],
                    id: 88
                }
                const response = await axios.post(config.get('WEB3_URI'), data)
                const result = response.data
                if (!result.error) {
                    const signers = result.result
                    await db.BlockSigner.updateOne({
                        blockHash: block.hash,
                        blockNumber: block.number
                    }, {
                        $set: {
                            blockHash: block.hash,
                            blockNumber: block.number,
                            signers: signers.map(it => (it || '').toLowerCase())
                        }
                    }, {
                        upsert: true
                    })
                } else {
                    logger.warn('Cannot get block signer of block %s. Error %s', blockNumber)
                    logger.warn(JSON.stringify(result.error))
                }
            } catch (e) {
                logger.warn('cannot get finality of block', block.number)
                logger.warn(e)
            }
        } catch (e) {
            logger.warn('Failed BlockSignerProcess %s', e)
            return false
        }
    }
    return true
}

module.exports = consumer
