'use strict'

const Web3Utils = require('../helpers/web3')
const utils = require('../helpers/utils')
const db = require('../models')
const logger = require('../helpers/logger')
const TokenHelper = require('../helpers/token')
const BigNumber = require('bignumber.js')

const consumer = {}
consumer.name = 'TokenTransactionProcess'
consumer.processNumber = 2
consumer.task = async function (job, done) {
    const web3 = await Web3Utils.getWeb3()
    try {
        let log = JSON.parse(job.data.log)
        logger.info('Process token transaction: ')
        let _log = log
        if (typeof log.topics[1] === 'undefined' ||
            typeof log.topics[2] === 'undefined') {
            return done()
        }
        const q = require('./index')

        if (log.topics[1]) {
            _log.from = await utils.unformatAddress(log.topics[1])
        }
        if (log.topics[2]) {
            _log.to = await utils.unformatAddress(log.topics[2])
        }
        _log.address = _log.address.toLowerCase()
        let transactionHash = _log.transactionHash.toLowerCase()

        let token = await db.Token.findOne({ hash: _log.address })
        let tokenType
        let decimals
        if (token && token.type) {
            tokenType = token.type
            decimals = token.decimals
        } else {
            let code = await web3.eth.getCode(_log.address)
            if (code === '0x') {
                return done()
            }
            let tokenFuncs = await TokenHelper.getTokenFuncs()
            decimals = await web3.eth.call({ to: token, data: tokenFuncs['decimals'] })
            decimals = await web3.utils.hexToNumberString(decimals)
            tokenType = await TokenHelper.checkTokenType(code)
        }
        if (tokenType === 'trc20' || tokenType === 'trc21') {
            _log.value = web3.utils.hexToNumberString(log.data)

            let vl = new BigNumber(_log.value || 0)
            _log.valueNumber = vl.dividedBy(10 ** parseInt(decimals)).toNumber() || 0

            delete _log['_id']
            if (tokenType === 'trc20') {
                await db.TokenTx.updateOne(
                    { transactionHash: transactionHash, from: _log.from, to: _log.to },
                    _log,
                    { upsert: true, new: true })
            } else {
                await db.TokenTrc21Tx.updateOne(
                    { transactionHash: transactionHash, from: _log.from, to: _log.to },
                    _log,
                    { upsert: true, new: true })
            }

            // Add token holder data.
            if (_log.from.toLowerCase() !== _log.to.toLowerCase()) {
                q.create('TokenHolderProcess', {
                    token: JSON.stringify({
                        from: _log.from.toLowerCase(),
                        to: _log.to.toLowerCase(),
                        address: _log.address,
                        value: _log.value
                    })
                })
                    .priority('normal').removeOnComplete(true)
                    .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
            }

            q.create('CountProcess', {
                data: JSON.stringify([
                    { hash: _log.from, countType: 'tokenTx' },
                    { hash: _log.to, countType: 'tokenTx' }
                ])
            })
                .priority('normal').removeOnComplete(true)
                .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
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
            }
        }
    } catch (e) {
        logger.warn('cannot process token tx. Error %s', e)
        return done(e)
    }

    return done()
}

module.exports = consumer
