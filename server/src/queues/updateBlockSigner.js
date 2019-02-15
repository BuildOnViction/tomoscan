'use strict'

const db = require('../models')
const logger = require('../helpers/logger')
const axios = require('axios')
const config = require('config')

const consumer = {}
consumer.name = 'BlockSignerProcess'
consumer.processNumber = 1

consumer.task = async function (job, done) {
    let blockNumber = parseInt(job.data.block)
    let block = await db.Block.findOne({ number: blockNumber })
    if (block) {
        logger.info('Update signers for block %s %s', block.number, block.hash)
        try {
            let data = {
                'jsonrpc': '2.0',
                'method': 'eth_getBlockFinalityByHash',
                'params': [block.hash],
                'id': 88
            }
            const response = await axios.post(config.get('WEB3_URI'), data)
            let result = response.data

            let signers = result.result
            await db.BlockSigner.updateOne({
                blockHash: block.hash,
                blockNumber: block.number
            }, {
                $set: {
                    blockHash: block.hash,
                    blockNumber: block.n,
                    signers: signers.map(it => (it || '').toLowerCase())
                }
            }, {
                upsert: true
            })
            done()
        } catch (e) {
            logger.warn(e)
            done(e)
        }
    }
}

module.exports = consumer
