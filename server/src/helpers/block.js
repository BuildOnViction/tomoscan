'use strict'

const Web3Util = require('./web3')
const utils = require('./utils')
const db = require('../models')
const logger = require('./logger')
const axios = require('axios')
const config = require('config')
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

        let start = new Date()
        let _block = await web3.eth.getBlock(blockNumber)
        let end = new Date() - start
        logger.info(`Execution time : %dms web3.eth.getBlock(${blockNumber})`, end)

        if (!_block) {
            return null
        }

        let timestamp = _block.timestamp * 1000

        // Get signer.
        let signer = await utils.toAddress(await utils.getSigner(_block), 100)
        signer = signer.toLowerCase()

        try {
            _block.m2 = await utils.getM2(_block)
        } catch (e) {
            logger.warn('Cannot get m2 of block %s. Error %s', _block.number, e)
            _block.m2 = 'N/A'
        }

        // Update end tx count.
        _block.timestamp = timestamp
        _block.e_tx = _block.transactions.length
        _block.signer = signer

        let data = {
            'jsonrpc': '2.0',
            'method': 'eth_getBlockFinalityByHash',
            'params': [_block.hash],
            'id': 88
        }
        const response = await axios.post(config.get('WEB3_URI'), data)
        let result = response.data

        let finalityNumber = parseInt(result.result)

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

        return { txs, timestamp, signer }
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

            try {
                _block.m2 = await utils.getM2(_block)
            } catch (e) {
                logger.warn('Cannot get m2 of block %s. Error %s', _block.number, e)
                _block.m2 = 'N/A'
            }

            // Update end tx count.
            _block.timestamp = _block.timestamp * 1000
            _block.e_tx = _block.transactions.length

            let data = {
                'jsonrpc': '2.0',
                'method': 'eth_getBlockFinalityByHash',
                'params': [_block.hash],
                'id': 88
            }
            const response = await axios.post(config.get('WEB3_URI'), data)
            let result = response.data

            _block.finality = parseInt(result.result)
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
            let _block = await BlockHelper.getBlock(number)
            if (!_block) {
                return null
            }
            // Get signer.
            let signer = await utils.toAddress(await utils.getSigner(_block), 100)
            _block.signer = signer.toLowerCase()

            // Update end tx count.
            _block.timestamp = _block.timestamp * 1000
            _block.e_tx = _block.transactions.length

            let data = {
                'jsonrpc': '2.0',
                'method': 'eth_getBlockFinalityByHash',
                'params': [_block.hash],
                'id': 88
            }
            const response = await axios.post(config.get('WEB3_URI'), data)
            let result = response.data

            let finalityNumber = parseInt(result.result)

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
