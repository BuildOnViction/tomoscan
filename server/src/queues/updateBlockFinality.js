'use strict'

const db = require('../models')
const logger = require('../helpers/logger')
const axios = require('axios')
const config = require('config')
const Web3Util = require('../helpers/web3')
const q = require('../queues')
const consumer = {}
consumer.name = 'BlockFinalityProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    const web3 = await Web3Util.getWeb3()
    let blocks = await db.Block.find({ finality: { $lt: 75 }, updateFinalityTime: { $lt: 10 } })
        .sort({ number: -1 }).limit(50)
    logger.info('Update finality %s blocks', blocks.length)
    try {
        let map = blocks.map(async function (block) {
            let blockOnChain = await web3.eth.getBlock(block.number)
            if (block.hash === blockOnChain.hash) {
                let data = {
                    'jsonrpc': '2.0',
                    'method': 'eth_getBlockFinalityByHash',
                    'params': [block.hash],
                    'id': 88
                }
                const response = await axios.post(config.get('WEB3_URI'), data)
                let result = response.data

                block.finality = parseInt(result.result)
                block.updateFinalityTime = block.updateFinalityTime ? block.updateFinalityTime + 1 : 1
                block.save()
            } else {
                logger.warn('BlockReOrg %s. ReOrg block %s, finality block %s',
                    block.number, block.hash, blockOnChain.hash)
                await db.Block.deleteOne({ hash: block.hash })
                await db.Tx.deleteMany({ blockHash: block.hash })
                await db.Internal.deleteMany({ blockHash: block.hash })
                await db.ContractEvent.deleteMany({ blockHash: block.hash })
                await db.Log.deleteMany({ blockHash: block.hash })
                await db.TokenNftTx.deleteMany({ blockHash: block.hash })
                await db.TokenTrc21Tx.deleteMany({ blockHash: block.hash })
                await db.TokenTx.deleteMany({ blockHash: block.hash })

                q.create('BlockProcess', { block: block.number })
                    .priority('high').removeOnComplete(true)
                    .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
            }
        })
        await Promise.all(map)
        return done()
    } catch (e) {
        logger.warn(e)
        return done(e)
    }
}

module.exports = consumer
