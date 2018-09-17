'use strict'

import Web3Util from './web3'
import { getSigner, toAddress } from './utils'

const db = require('../models')
const emitter = require('../helpers/errorHandler')

let BlockHelper = {
    crawlBlock:async (blockNumber) => {
        try {
            let block = db.Block.findOne({ number: blockNumber })
            let countTx = await db.Tx.count({ blockNumber: blockNumber })
            if (block && countTx === block.e_tx) {
                console.log('Block already processed', blockNumber)
                return null
            }

            let web3 = await Web3Util.getWeb3()
            let _block = await web3.eth.getBlock(blockNumber)
            if (!_block) {
                return null
            }

            let timestamp = _block.timestamp * 1000

            // Get signer.
            let signer = toAddress(getSigner(_block), 100)
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

            // const q = require('../queues')
            let signers = []
            if (_block.signers && _block.signers.length) {
                signers = _block.signers
            }
            delete _block['_id']
            delete _block['signers']

            block = await db.Block.findOneAndUpdate({ number: _block.number }, _block,
                { upsert: true, new: true })

            await db.BlockSigner.findOneAndUpdate({ blockNumber: blockNumber },
                {
                    blockNumber: blockNumber,
                    finality: finalityNumber,
                    signers: signers
                }, { upsert: true, new: true })

            return { txs, timestamp }
        } catch (e) {
            emitter.emit('error', e)
        }
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
            let signer = toAddress(getSigner(_block), 100)
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

            await db.BlockSigner.findOneAndUpdate({ blockNumber: _block.number }, {
                blockNumber: _block.number,
                finality: finalityNumber,
                signers: _block.signers
            }, { upsert: true, new: true })

            delete _block['_id']
            delete _block['signers']

            block = await db.Block.findOneAndUpdate({ number: _block.number }, _block,
                { upsert: true, new: true })

            return block
        } catch (e) {
            console.error(e)
            return {}
        }
    }
}

export default BlockHelper
