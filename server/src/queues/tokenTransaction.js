'use strict'

const Web3Utils = require('../helpers/web3')
const utils = require('../helpers/utils')
const db = require('../models')
const logger = require('../helpers/logger')

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

        if (log.data !== '0x') {
            _log.value = web3.utils.hexToNumberString(log.data)
            _log.valueNumber = _log.value

            delete _log['_id']
            let tokenTx = await db.TokenTx.findOne({ transactionHash: transactionHash, from: _log.from, to: _log.to })
            if (!tokenTx) {
                await db.TokenTx.updateOne(
                    { transactionHash: transactionHash, from: _log.from, to: _log.to },
                    _log,
                    { upsert: true, new: true })

                // Add token holder data.
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
        } else {
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
