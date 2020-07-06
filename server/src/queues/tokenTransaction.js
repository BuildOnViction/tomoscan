'use strict'

const Web3Utils = require('../helpers/web3')
const utils = require('../helpers/utils')
const db = require('../models')
const logger = require('../helpers/logger')
const TokenHelper = require('../helpers/token')
const BigNumber = require('bignumber.js')
const elastic = require('../helpers/elastic')

const consumer = {}
consumer.name = 'TokenTransactionProcess'
consumer.processNumber = 2
consumer.task = async function (job) {
    const web3 = await Web3Utils.getWeb3()
    try {
        const log = JSON.parse(job.log)
        const timestamp = new Date(job.timestamp)
        logger.info('Process token tx for transaction: %s', log.transactionHash)
        const _log = log
        if (typeof log.topics[1] === 'undefined' ||
            typeof log.topics[2] === 'undefined') {
            return true
        }
        const Queue = require('./index')

        if (log.topics[1]) {
            _log.from = await utils.unformatAddress(log.topics[1])
        }
        if (log.topics[2]) {
            _log.to = await utils.unformatAddress(log.topics[2])
        }
        _log.address = _log.address.toLowerCase()
        const transactionHash = _log.transactionHash.toLowerCase()
        _log.timestamp = timestamp

        const token = await db.Token.findOne({ hash: _log.address })
        let tokenType
        let decimals
        if (token && token.type) {
            tokenType = token.type
            decimals = token.decimals
        } else {
            const code = await web3.eth.getCode(_log.address)
            if (code === '0x') {
                return true
            }
            const tokenFuncs = await TokenHelper.getTokenFuncs()
            decimals = await web3.eth.call({ to: _log.address, data: tokenFuncs.decimals })
            decimals = await web3.utils.hexToNumberString(decimals)
            tokenType = await TokenHelper.checkTokenType(code)
        }
        if (!Number.isInteger(_log.blockNumber)) {
            _log.blockNumber = web3.utils.hexToNumber(_log.blockNumber)
        }
        if (!Number.isInteger(_log.transactionIndex)) {
            _log.transactionIndex = web3.utils.hexToNumber(_log.transactionIndex)
        }
        if (tokenType === 'trc20' || tokenType === 'trc21') {
            _log.value = web3.utils.hexToNumberString(log.data)

            const vl = new BigNumber(_log.value || 0)
            _log.valueNumber = vl.dividedBy(10 ** parseInt(decimals)).toNumber() || 0

            delete _log._id
            if (tokenType === 'trc20') {
                await db.TokenTx.updateOne(
                    { transactionHash: transactionHash, from: _log.from, to: _log.to },
                    _log,
                    { upsert: true, new: true })
                _log.valueNumber = String(_log.valueNumber)
                await elastic.indexWithoutId('trc20-tx', {
                    address: _log.address,
                    blockHash: _log.blockHash,
                    blockNumber: _log.blockNumber,
                    timestamp: timestamp.toISOString()
                        .replace(/T/, ' ').replace(/\..+/, ''),
                    from: _log.from,
                    to: _log.to,
                    transactionHash: _log.transactionHash,
                    transactionIndex: _log.transactionIndex,
                    value: _log.value,
                    valueNumber: _log.valueNumber
                })
            } else {
                await db.TokenTrc21Tx.updateOne(
                    { transactionHash: transactionHash, from: _log.from, to: _log.to },
                    _log,
                    { upsert: true, new: true })
                _log.valueNumber = String(_log.valueNumber)
                await elastic.indexWithoutId('trc21-tx', {
                    address: _log.address,
                    blockHash: _log.blockHash,
                    blockNumber: _log.blockNumber,
                    timestamp: timestamp.toISOString()
                        .replace(/T/, ' ').replace(/\..+/, ''),
                    from: _log.from,
                    to: _log.to,
                    transactionHash: _log.transactionHash,
                    transactionIndex: _log.transactionIndex,
                    value: _log.value,
                    valueNumber: _log.valueNumber
                })
            }

            // Add token holder data.
            if (_log.from.toLowerCase() !== _log.to.toLowerCase()) {
                Queue.newQueue('TokenHolderProcess', {
                    token: JSON.stringify({
                        from: _log.from.toLowerCase(),
                        to: _log.to.toLowerCase(),
                        address: _log.address,
                        value: _log.value
                    })
                })
            }
        } else if (tokenType === 'trc721') {
            if (log.topics[3]) {
                _log.tokenId = await web3.utils.hexToNumber(log.topics[3])
                await db.TokenNftTx.updateOne(
                    { transactionHash: transactionHash, from: _log.from, to: _log.to },
                    _log,
                    { upsert: true, new: true })

                await db.TokenNftHolder.updateOne(
                    { token: _log.address, tokenId: _log.tokenId },
                    { holder: _log.to }, { upsert: true, new: true })
                await elastic.indexWithoutId('nft-tx', {
                    address: _log.address,
                    blockHash: _log.blockHash,
                    blockNumber: _log.blockNumber,
                    timestamp: timestamp.toISOString()
                        .replace(/T/, ' ').replace(/\..+/, ''),
                    transactionHash: _log.transactionHash,
                    transactionIndex: _log.transactionIndex,
                    from: _log.from,
                    to: _log.to,
                    data: _log.data,
                    tokenId: _log.tokenId
                })
            }
        }
    } catch (e) {
        logger.warn('cannot process token tx. Error %s', e)
        return false
    }

    return true
}

module.exports = consumer
