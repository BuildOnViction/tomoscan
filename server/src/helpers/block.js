'use strict'

const Web3Util = require('./web3')
const utils = require('./utils')
const db = require('../models')
const logger = require('./logger')
const axios = require('axios')
const config = require('config')
const elastic = require('../helpers/elastic')
const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

const BlockHelper = {
    crawlBlock:async (blockNumber) => {
        const block = await db.Block.findOne({ number: blockNumber })
        const countTx = await db.Tx.countDocuments({ blockNumber: blockNumber })
        if (block && countTx === block.e_tx) {
            logger.info('Block already processed %s', blockNumber)
            return null
        }

        const web3 = await Web3Util.getWeb3()

        const start = new Date()
        const _block = await web3.eth.getBlock(blockNumber)
        const end = new Date() - start
        logger.info(`Execution time : %dms web3.eth.getBlock(${blockNumber})`, end)

        if (!_block) {
            return null
        }
        const { m1, m2 } = await utils.getM1M2(_block)
        _block.m2 = m2
        _block.signer = m1

        const timestamp = _block.timestamp * 1000

        // Update end tx count.
        _block.timestamp = timestamp
        _block.e_tx = _block.transactions.length

        try {
            const data = {
                jsonrpc: '2.0',
                method: 'eth_getBlockFinalityByHash',
                params: [_block.hash],
                id: 88
            }
            const response = await axios.post(config.get('WEB3_URI'), data, { timeout: 300 })
            const result = response.data

            let finalityNumber = parseInt(result.result)
            // blockNumber = 0 is genesis block
            if (parseInt(blockNumber) === 0) {
                finalityNumber = 100
            }

            _block.finality = finalityNumber
        } catch (e) {
            logger.warn('Cannot get block finality %s', blockNumber)
            logger.warn(e)
        }

        const txs = _block.transactions
        delete _block.transactions
        _block.status = true
        _block.updateFinalityTime = 0

        delete _block._id
        delete _block.signers

        await db.Block.updateOne({ number: _block.number }, _block,
            { upsert: true, new: true })
        await elastic.index(_block.hash, 'blocks', _block)

        if (_block.number % config.get('BLOCK_PER_EPOCH') === 0) {
            const slashedNode = []
            const blk = await BlockHelper.getBlock(_block.number)
            if (blk.penalties && blk.penalties !== '0x') {
                const sbuff = Buffer.from((blk.penalties || '').substring(2), 'hex')
                if (sbuff.length > 0) {
                    for (let i = 1; i <= sbuff.length / 20; i++) {
                        const address = sbuff.slice((i - 1) * 20, i * 20)
                        const add = '0x' + address.toString('hex')
                        slashedNode.push(add.toLowerCase())
                    }
                }
            }

            const buff = Buffer.from(blk.extraData.substring(2), 'hex')
            const sbuff = buff.slice(32, buff.length - 65)
            const signers = []
            if (sbuff.length > 0) {
                for (let i = 1; i <= sbuff.length / 20; i++) {
                    const address = sbuff.slice((i - 1) * 20, i * 20)
                    signers.push('0x' + address.toString('hex'))
                }
            }
            const epoch = _block.number / config.get('BLOCK_PER_EPOCH')

            // TODO: update slash for next 5 epochs
            if (slashedNode.length > 0) {
                for (let i = 0; i < 5; i++) {
                    const nextEpoch = epoch + 1 + i
                    const e = await db.Epoch.findOne({ epoch: nextEpoch })
                    if (e) {
                        const sn = e.slashedNode
                        const newArr = sn.concat(slashedNode)
                        e.slashedNode = Array.from(new Set(newArr))
                        await e.save()
                    } else {
                        const ne = new db.Epoch({
                            epoch: nextEpoch,
                            startBlock: (nextEpoch - 1) * 900 + 1,
                            endBlock: nextEpoch * 900,
                            slashedNode: slashedNode,
                            isActive: false
                        })
                        await ne.save()
                    }
                }
            }
        }

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

            const web3 = await Web3Util.getWeb3()
            const _block = await web3.eth.getBlock(hashOrNumber)
            if (!_block) {
                return null
            }
            try {
                const { m1, m2 } = await utils.getM1M2(_block)

                _block.m2 = m2
                _block.signer = m1
            } catch (e) {
                logger.warn('Cannot get M1, M2 of block %s', hashOrNumber)
                logger.warn(e)
            }

            // Update end tx count.
            _block.timestamp = _block.timestamp * 1000
            _block.e_tx = _block.transactions.length

            try {
                const data = {
                    jsonrpc: '2.0',
                    method: 'eth_getBlockFinalityByHash',
                    params: [_block.hash],
                    id: 88
                }
                const response = await axios.post(config.get('WEB3_URI'), data, { timeout: 300 })
                const result = response.data

                _block.finality = parseInt(result.result)
            } catch (e) {
                logger.warn('Cannot get block finality %s', hashOrNumber)
                logger.warn(e)
            }

            _block.status = true
            if (block) {
                if (!Object.prototype.hasOwnProperty.call(block, 'updateFinalityTime')) {
                    _block.updateFinalityTime = 0
                }
            } else {
                _block.updateFinalityTime = 0
            }

            delete _block._id
            delete _block.signers

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
            const _block = await BlockHelper.getBlock(number)
            if (!_block) {
                return null
            }
            // Get signer.
            const signer = await utils.toAddress(await utils.getSigner(_block), 100)
            _block.signer = signer.toLowerCase()

            // Update end tx count.
            _block.timestamp = _block.timestamp * 1000
            _block.e_tx = _block.transactions.length

            try {
                const data = {
                    jsonrpc: '2.0',
                    method: 'eth_getBlockFinalityByHash',
                    params: [_block.hash],
                    id: 88
                }
                const response = await axios.post(config.get('WEB3_URI'), data, { timeout: 300 })
                const result = response.data

                let finalityNumber = parseInt(result.result)

                // blockNumber = 0 is genesis block
                if (parseInt(_block.number) === 0) {
                    finalityNumber = 100
                }

                _block.finality = finalityNumber
            } catch (e) {
                logger.warn('Cannot get block finality %s', number)
                logger.warn(e)
            }

            _block.status = true

            return _block
        } catch (e) {
            logger.warn('cannot get block on chain with error %s', e)
            return {}
        }
    },
    getBlock: async (number) => {
        const web3 = await Web3Util.getWeb3()
        return web3.eth.getBlock(number).catch(e => {
            logger.warn('Cannot get block %s detail. Sleep 2 seconds and try more. Error %s', number, e)
            return sleep(2000).then(() => {
                return BlockHelper.getBlock(number)
            })
        })
    },
    getLastBlockNumber: async () => {
        const web3 = await Web3Util.getWeb3()
        return web3.eth.getBlockNumber().catch(e => {
            logger.warn('Cannot get last block number. Sleep 2 seconds and try more. Error %s', e)
            return sleep(2000).then(() => {
                return BlockHelper.getLastBlockNumber()
            })
        })
    }
}

module.exports = BlockHelper
