'use strict'

import Account from '../models/Account'
import Web3Util from '../helpers/web3'
import Tx from '../models/Tx'
import TokenHelper from '../helpers/token'

const consumer = {}
consumer.name = 'AccountProcess'
consumer.processNumber = 1
consumer.task = async function(job, done) {
    let hash = job.data.hash.toLowerCase()
    console.log('Process account: ', hash)
    let _account = await Account.findOne({ hash: hash, nonce: { $exists: true } })
    _account = _account || {}

    let web3 = await Web3Util.getWeb3()

    let balance = await web3.eth.getBalance(hash)
    if (_account.balance !== balance) {
        _account.balance = balance
        _account.balanceNumber = balance
    }

    let txCount = await Tx.find({ $or: [ { to: hash }, { from: hash } ] }).count()
    if (_account.transactionCount !== txCount) {
        _account.transactionCount = txCount
    }

    let code = await web3.eth.getCode(hash)
    if (_account.code !== code) {
        _account.code = code

        let isToken = await TokenHelper.checkIsToken(code)
        if (isToken) {
            // Insert token pending.
            const q = require('./index')
            console.log('Queue token: ', hash)
            await q.create('TokenProcess', {hash: hash})
                .priority('normal').removeOnComplete(true).save()
        }
        _account.isToken = isToken
    }

    _account.isContract = (_account.code !== '0x')
    _account.status = true

    delete _account['_id']

    await Account.findOneAndUpdate({ hash: hash }, _account,
        { upsert: true, new: true }).lean()

    done()

}
