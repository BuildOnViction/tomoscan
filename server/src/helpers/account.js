'use strict'

import Web3Util from './web3'
import TokenHelper from './token'
const db = require('../models')

let AccountHelper = {
    getAccountDetail: async (hash) => {
        hash = hash.toLowerCase()
        let _account = await db.Account.findOne({ hash: hash })
        _account = _account || {}

        let web3 = await Web3Util.getWeb3()

        let balance = await web3.eth.getBalance(hash)
        if (_account.balance !== balance) {
            _account.balance = balance
            _account.balanceNumber = balance
        }

        let code = await web3.eth.getCode(hash)
        if (_account.code !== code) {
            _account.code = code

            _account.isToken = await TokenHelper.checkIsToken(code)
        }

        _account.isContract = (_account.code !== '0x')
        _account.status = true

        delete _account['_id']

        let ac = await db.Account.findOneAndUpdate({ hash: hash }, _account, { upsert: true, new: true })
        return ac
    },
    processAccount:async (hash, next) => {
        hash = hash.toLowerCase()
        try {
            let _account = await db.Account.findOne({ hash: hash })
            if (!_account) {
                _account = {}
            }

            let web3 = await Web3Util.getWeb3()

            let balance = await web3.eth.getBalance(hash)
            if (_account.balance !== balance) {
                _account.balance = balance
                _account.balanceNumber = balance
            }

            if (_account.transactionCount) {
                _account.transactionCount += 1
            } else {
                _account.transactionCount = 1
            }

            let code = await web3.eth.getCode(hash)
            if (_account.code !== code) {
                _account.code = code

                let isToken = await TokenHelper.checkIsToken(code)
                if (isToken) {
                    const q = require('../queues')
                    q.create('TokenProcess', { address: hash })
                        .priority('normal').removeOnComplete(true).save()
                }
                _account.isToken = isToken
            }

            _account.isContract = (_account.code !== '0x')
            if (_account.isContract) {
                const queue = require('../queues')
                queue.create('ContractProcess', { address: hash })
                    .priority('normal').removeOnComplete(true).save()
            }
            _account.status = true

            delete _account['_id']

            let acc = await db.Account.findOneAndUpdate({ hash: hash }, _account,
                { upsert: true, new: true })

            return acc
        } catch (e) {
            next(e)
        }
    },
    async formatAccount (account) {
        // Find txn create from.
        let fromTxn = null
        account = account.toJSON()
        if (account.isContract) {
            let tx = await db.Tx.findOne({
                from: account.contractCreation,
                to: null,
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
        let contract = await db.Contract.findOne({ hash: account.hash })
        account.contract = contract

        // Check has token holders.
        let hasTokens = await db.TokenHolder.findOne({ hash: account.hash })
        account.hashTokens = !!hasTokens
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
            console.trace(e)
            throw e
        }
    }
}

export default AccountHelper
