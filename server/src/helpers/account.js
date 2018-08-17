'use strict'

import Web3Util from './web3'
import TokenHelper from './token'

const db = require('../models')

let AccountHelper = {
    processAccount:async (hash) => {
        let _account = await db.Account.findOne({ hash: hash, nonce: { $exists: true } })
        _account = _account || {}

        let web3 = await Web3Util.getWeb3()

        let balance = await web3.eth.getBalance(hash)
        if (_account.balance !== balance) {
            _account.balance = balance
            _account.balanceNumber = balance
        }

        let txCount = await db.Tx.find({ $or: [ { to: hash }, { from: hash } ] }).count()
        if (_account.transactionCount !== txCount) {
            _account.transactionCount = txCount
        }

        let code = await web3.eth.getCode(hash)
        if (_account.code !== code) {
            _account.code = code

            let isToken = await TokenHelper.checkIsToken(code)
            if (isToken) {
                // Insert token pending.
                await db.Token.findOneAndUpdate({ hash: hash },
                    { hash: hash, status: false }, { upsert: true, new: true })
                const q = require('./index')
                await q.create('TokenProcess', { address: hash })
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
    }
}

export default AccountHelper
