'use strict'

const Web3Util = require('./web3')
const TokenHelper = require('./token')
const db = require('../models')
const logger = require('./logger')
const BigNumber = require('bignumber.js')

const AccountHelper = {
    getAccountDetail: async (hash) => {
        hash = hash.toLowerCase()

        const web3 = await Web3Util.getWeb3()
        let chainBalance = null
        const b = web3.eth.getBalance(hash, function (err, balance) {
            if (err) {
                logger.warn('get balance of account %s has error %s', hash, err)
            } else {
                chainBalance = balance
            }
        })

        let _account = await db.Account.findOne({ hash: hash })
        _account = _account || {}

        if (!Object.prototype.hasOwnProperty.call(_account, 'code')) {
            const code = await web3.eth.getCode(hash)
            if (code !== '0x') {
                _account.isContract = true
            }
            _account.code = code
            _account.isToken = await TokenHelper.checkIsToken(code)
        }
        _account.status = true

        delete _account._id
        await b
        if (chainBalance !== null) {
            _account.balance = chainBalance
            const bn = new BigNumber(chainBalance)
            _account.balanceNumber = bn.dividedBy(10 ** 18).toNumber()
        }
        if (_account.balanceNumber > 0 || _account.code !== '0x') {
            return db.Account.findOneAndUpdate({ hash: hash }, _account, { upsert: true, new: true })
        }
        return _account
    },
    processAccount:async (hash) => {
        hash = hash.toLowerCase()
        try {
            const web3 = await Web3Util.getWeb3()

            let chainBalance = null
            const b = web3.eth.getBalance(hash, function (err, balance) {
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

            if (!Object.prototype.hasOwnProperty.call(_account, 'code')) {
                const code = await web3.eth.getCode(hash)
                const Queue = require('../queues')
                if (code !== '0x') {
                    _account.isContract = true
                }
                _account.code = code

                const isToken = await TokenHelper.checkIsToken(code)
                if (isToken) {
                    Queue.newQueue('TokenProcess', { address: hash })
                }
                _account.isToken = isToken
            }

            _account.status = true

            delete _account._id

            await b
            if (chainBalance !== null) {
                _account.balance = chainBalance
                const bn = new BigNumber(chainBalance)
                _account.balanceNumber = bn.dividedBy(10 ** 18).toNumber()
            }
            if (_account.balanceNumber > 0 || _account.code !== '0x') {
                await db.Account.updateOne({ hash: hash }, _account,
                    { upsert: true, new: true })
            }
        } catch (e) {
            logger.warn('cannot process account %s. Error %s', hash, e)
        }
    },
    async formatAccount (account) {
        // Find txn create from.
        let fromTxn = null
        try {
            account = account.toJSON()
        } catch (e) {
            logger.warn('account is not from db %s', e)
        }
        if (account.isContract) {
            const tx = await db.Tx.findOne({
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
        const hasTrc20 = await db.TokenHolder.findOne({ hash: account.hash })
        const hasTrc21 = await db.TokenTrc21Holder.findOne({ hash: account.hash })
        const hasTrc721 = await db.TokenNftHolder.findOne({ holder: account.hash })
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
            const account = await db.Account.findOne({ hash: hash })
            if (!account) {
                const web3 = await Web3Util.getWeb3()
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
