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

        let txCount = await db.Tx.count({ $or: [ { to: hash }, { from: hash } ] })
        if (_account.transactionCount !== txCount) {
            _account.transactionCount = txCount
        }

        let code = await web3.eth.getCode(hash)
        if (_account.code !== code) {
            _account.code = code

            _account.isToken = await TokenHelper.checkIsToken(code)
        }

        _account.isContract = (_account.code !== '0x')
        _account.status = true

        delete _account['_id']

        return await db.Account.findOneAndUpdate({ hash: hash }, _account, { upsert: true, new: true })


    },
    processAccount:async (hash, startQueue) => {
        hash = hash.toLowerCase()
        let _account = await db.Account.findOne({ hash: hash })
        _account = _account || {}

        let web3 = await Web3Util.getWeb3()

        let balance = await web3.eth.getBalance(hash)
        if (_account.balance !== balance) {
            _account.balance = balance
            _account.balanceNumber = balance
        }

        let txCount = await db.Tx.count({ $or: [ { to: hash }, { from: hash } ] })
        if (_account.transactionCount !== txCount) {
            _account.transactionCount = txCount
        }

        let code = await web3.eth.getCode(hash)
        if (_account.code !== code) {
            _account.code = code

            let isToken = await TokenHelper.checkIsToken(code)
            if (isToken && startQueue) {
                // Insert token pending.
                await db.Token.findOneAndUpdate({ hash: hash },
                    { hash: hash }, { upsert: true, new: true })
                const q = require('../queues')
                q.create('TokenProcess', { address: hash })
                    .priority('normal').removeOnComplete(true).save()
            }
            _account.isToken = isToken
        }

        _account.isContract = (_account.code !== '0x')
        _account.status = true

        delete _account['_id']

        let acc = await db.Account.findOneAndUpdate({ hash: hash }, _account,
            { upsert: true, new: true })

        return acc
    },
    async formatAccount (address) {
        // Find txn create from.
        let fromTxn = null
        address = address.toJSON()
        if (address.isContract) {
            let tx = await db.Tx.findOne({
                from: address.contractCreation,
                to: null,
                contractAddress: address.hash
            })
            if (tx) {
                fromTxn = tx.hash
            }
        }
        address.fromTxn = fromTxn

        // Get token.
        let token = null
        if (address.isToken) {
            token = await db.Token.findOne(
                { hash: address.hash, quantity: { $gte: 0 } })
        }
        address.token = token

        // Inject contract to address object.
        address.contract = await db.Contract.findOne({ hash: address.hash })
        // console.log('address.contract:', address.hash, address.contract)

        // Check has token holders.
        let hasTokens = await db.TokenHolder.findOne({ hash: address.hash })
        address.hashTokens = !!hasTokens
        return address
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
