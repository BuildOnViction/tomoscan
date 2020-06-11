'use strict'

const db = require('../models')
const logger = require('../helpers/logger')
const axios = require('axios')
const config = require('config')
const Web3Util = require('../helpers/web3')
const Queue = require('../queues')
const consumer = {}
consumer.name = 'BlockFinalityProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    const web3 = await Web3Util.getWeb3()
    const blocks = await db.Block.find({ finality: { $lt: 60 }, updateFinalityTime: { $lt: 10 } })
        .sort({ number: -1 }).limit(50)
    logger.info('Update finality %s blocks', blocks.length)
    try {
        const map = blocks.map(async function (block) {
            const countTx = await db.Tx.countDocuments({ blockNumber: block.number })
            if (countTx !== block.e_tx) {
                Queue.newQueue('BlockProcess', { block: block.number })
            }
            const blockOnChain = await web3.eth.getBlock(block.number)
            if (block.hash === blockOnChain.hash) {
                try {
                    const data = {
                        jsonrpc: '2.0',
                        method: 'eth_getBlockFinalityByHash',
                        params: [block.hash],
                        id: 88
                    }
                    const response = await axios.post(config.get('WEB3_URI'), data)
                    const result = response.data

                    block.finality = parseInt(result.result)
                } catch (e) {
                    logger.warn('Cannot get block finality %s', block.number)
                    logger.warn(e)
                }
                if (Object.prototype.hasOwnProperty.call(block, 'updateFinalityTime')) {
                    block.updateFinalityTime = block.updateFinalityTime + 1
                } else {
                    block.updateFinalityTime = 1
                }
                await block.save()
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

                Queue.newQueue('BlockProcess', { block: block.number })
            }
        })
        await Promise.all(map)
        return true
    } catch (e) {
        logger.warn(e)
        return false
    }
}

module.exports = consumer
