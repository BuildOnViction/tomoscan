'use strict'

const Web3Util = require('./web3')
const TokenHelper = require('./token')
const db = require('../models')
const logger = require('./logger')
const BigNumber = require('bignumber.js')

let AccountHelper = {
    getAccountDetail: async (hash) => {
        hash = hash.toLowerCase()

        let web3 = await Web3Util.getWeb3()
        let chainBalance = null
        let b = web3.eth.getBalance(hash, function (err, balance) {
            if (err) {
                logger.warn('get balance of account %s has error %s', hash, err)
            } else {
                chainBalance = balance
            }
        })

        let _account = await db.Account.findOne({ hash: hash })
        _account = _account || {}

        if (!_account.hasOwnProperty('code')) {
            let code = await web3.eth.getCode(hash)
            if (code !== '0x') {
                _account.isContract = true
            }
            _account.code = code
            _account.isToken = await TokenHelper.checkIsToken(code)
        }
        _account.status = true

        delete _account['_id']
        await b
        if (chainBalance !== null) {
            _account.balance = chainBalance
            let bn = new BigNumber(chainBalance)
            _account.balanceNumber = bn.dividedBy(10 ** 18)
        }
        let acc = await db.Account.findOneAndUpdate({ hash: hash }, _account, { upsert: true, new: true })
        return acc
    },
    processAccount:async (hash) => {
        hash = hash.toLowerCase()
        try {
            let web3 = await Web3Util.getWeb3()

            let chainBalance = null
            let b = web3.eth.getBalance(hash, function (err, balance) {
                if (err) {
                    logger.warn('get balance of account %s has error %s', hash, err)
                } else {
                    chainBalance = balance
                }
            })
            let _account = await db.Account.findOne({ hash: hash })
            if (!_account) {
                _account = {}
            }

            if (!_account.hasOwnProperty('code')) {
                let code = await web3.eth.getCode(hash)
                const q = require('../queues')
                if (code !== '0x') {
                    _account.isContract = true
                }
                _account.code = code

                let isToken = await TokenHelper.checkIsToken(code)
                if (isToken) {
                    q.create('TokenProcess', { address: hash })
                        .priority('normal').removeOnComplete(true)
                        .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
                }
                _account.isToken = isToken
            }

            _account.status = true

            delete _account['_id']

            await b
            if (chainBalance !== null) {
                _account.balance = chainBalance
                let bn = new BigNumber(chainBalance)
                _account.balanceNumber = bn.dividedBy(10 ** 18)
            }
            await db.Account.updateOne({ hash: hash }, _account,
                { upsert: true, new: true })
        } catch (e) {
            logger.warn('cannot process account %s. Error %s', hash, e)
        }
    },
    async formatAccount (account) {
        // Find txn create from.
        let fromTxn = null
        account = account.toJSON()
        if (account.isContract) {
            let tx = await db.Tx.findOne({
                contractAddress: account.hash
            })
            if (tx) {
                fromTxn = tx.hash
            }
        }
        account.fromTxn = fromTxn

        // Get token.
        let token = null
        if (account.isToken) {
            token = await db.Token.findOne({ hash: account.hash })
        }
        account.token = token

        // Inject contract to account object.
        account.contract = await db.Contract.findOne({ hash: account.hash })

        // Check has token holders.
        let hasTrc20 = await db.TokenHolder.findOne({ hash: account.hash })
        let hasTrc21 = await db.TokenTrc21Holder.findOne({ hash: account.hash })
        let hasTrc721 = await db.TokenNftHolder.findOne({ holder: account.hash })
        account.hasTrc20 = !!hasTrc20
        account.hasTrc21 = !!hasTrc21
        account.hasTrc721 = !!hasTrc721
        return account
    },

    async getCode (hash) {
        try {
            if (!hash) { return }
            hash = hash.toLowerCase()
            let code = ''
            let account = await db.Account.findOne({ hash: hash })
            if (!account) {
                let web3 = await Web3Util.getWeb3()
                code = await web3.eth.getCode(hash)
            } else {
                code = account.code
            }

            return code
        } catch (e) {
            logger.trace(e)
            throw e
        }
    }
}

module.exports = AccountHelper
