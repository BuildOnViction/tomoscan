'use strict'

const Web3Util = require('./web3')
const utils = require('./utils')
const db = require('../models')
const logger = require('./logger')
let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

let BlockHelper = {
    crawlBlock:async (blockNumber) => {
        let block = await db.Block.findOne({ number: blockNumber })
        let countTx = await db.Tx.countDocuments({ blockNumber: blockNumber })
        if (block && countTx === block.e_tx) {
            logger.info('Block already processed %s', blockNumber)
            return null
        }

        let web3 = await Web3Util.getWeb3()
        let _block = await web3.eth.getBlock(blockNumber)
        if (!_block) {
            return null
        }

        let timestamp = _block.timestamp * 1000

        // Get signer.
        let signer = await utils.toAddress(await utils.getSigner(_block), 100)
        signer = signer.toLowerCase()

        // Update end tx count.
        let endTxCount = await web3.eth.getBlockTransactionCount(_block.hash)
        _block.timestamp = timestamp
        _block.e_tx = endTxCount
        _block.signer = signer

        let finalityNumber
        if (_block.finality) {
            finalityNumber = parseInt(_block.finality)
        } else {
            finalityNumber = 0
        }

        // blockNumber = 0 is genesis block
        if (parseInt(blockNumber) === 0) {
            finalityNumber = 100
        }

        _block.finality = finalityNumber
        let txs = _block.transactions
        delete _block['transactions']
        _block.status = true
        _block.updateFinalityTime = 0

        delete _block['_id']
        delete _block['signers']

        await db.Block.updateOne({ number: _block.number }, _block,
            { upsert: true, new: true })

        return { txs, timestamp }
    },
    getBlockDetail: async (hashOrNumber) => {
        try {
            let block = await db.Block.findOne({ number: hashOrNumber })
            if (!block) {
                block = await db.Block.findOne({ hash: String(hashOrNumber).toLowerCase() })
            }
            if (block && block.finality === 100) {
                return block
            }

            let web3 = await Web3Util.getWeb3()
            let _block = await web3.eth.getBlock(hashOrNumber)
            if (!_block) {
                return null
            }
            // Get signer.
            let signer = await utils.toAddress(await utils.getSigner(_block), 100)
            _block.signer = signer.toLowerCase()

            // Update end tx count.
            let endTxCount = await web3.eth.getBlockTransactionCount(_block.hash)
            _block.timestamp = _block.timestamp * 1000
            _block.e_tx = endTxCount

            let finalityNumber
            if (_block.finality) {
                finalityNumber = parseInt(_block.finality)
            } else {
                finalityNumber = 0
            }

            // blockNumber = 0 is genesis block
            if (parseInt(_block.number) === 0) {
                finalityNumber = 100
            }

            _block.finality = finalityNumber
            _block.status = true
            if (block) {
                if (!block.hasOwnProperty('updateFinalityTime')) {
                    _block.updateFinalityTime = 0
                }
            } else {
                _block.updateFinalityTime = 0
            }

            delete _block['_id']
            delete _block['signers']

            block = await db.Block.findOneAndUpdate({ number: _block.number }, _block,
                { upsert: true, new: true })

            return block
        } catch (e) {
            logger.warn('cannot get block %s with error %s', hashOrNumber, e)
            return {}
        }
    },
    getBlockOnChain: async (number) => {
        try {
            let web3 = await Web3Util.getWeb3()
            let _block = await BlockHelper.getBlock(number)
            if (!_block) {
                return null
            }
            // Get signer.
            let signer = await utils.toAddress(await utils.getSigner(_block), 100)
            _block.signer = signer.toLowerCase()

            // Update end tx count.
            let endTxCount = await web3.eth.getBlockTransactionCount(_block.hash)
            _block.timestamp = _block.timestamp * 1000
            _block.e_tx = endTxCount

            let finalityNumber
            if (_block.finality) {
                finalityNumber = parseInt(_block.finality)
            } else {
                finalityNumber = 0
            }

            // blockNumber = 0 is genesis block
            if (parseInt(_block.number) === 0) {
                finalityNumber = 100
            }

            _block.finality = finalityNumber
            _block.status = true

            return _block
        } catch (e) {
            logger.warn('cannot get block on chain with error %s', e)
            return {}
        }
    },
    getBlock: async (number) => {
        let web3 = await Web3Util.getWeb3()
        return web3.eth.getBlock(number).catch(e => {
            logger.warn('Cannot get block %s detail. Sleep 2 seconds and try more. Error %s', number, e)
            return sleep(2000).then(() => {
                return BlockHelper.getBlock(number)
            })
        })
    },
    getLastBlockNumber: async () => {
        let web3 = await Web3Util.getWeb3()
        return web3.eth.getBlockNumber().catch(e => {
            logger.warn('Cannot get last block number. Sleep 2 seconds and try more. Error %s', e)
            return sleep(2000).then(() => {
                return BlockHelper.getLastBlockNumber()
            })
        })
    }
}

module.exports = BlockHelper
