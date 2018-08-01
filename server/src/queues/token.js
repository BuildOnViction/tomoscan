'use strict'

import Web3Util from '../helpers/web3'
import TokenHelper from '../helpers/token'
import {trimWord} from '../helpers/utils'
const db = require('../models')

const consumer = {}
consumer.name = 'TokenProcess'
consumer.processNumber = 2
consumer.task = async function(job, done) {
    let address = job.data.address
    console.log('Process token: ', address)
    let token = await db.Token.findOne({ hash: address })
    if (!token) {
        token = await db.Token.findOneAndUpdate({ hash: address },
            { hash: address, status: false }, { upsert: true, new: true })
    }
    let tokenFuncs = await TokenHelper.getTokenFuncs()

    let web3 = await Web3Util.getWeb3()

    if (typeof token.name === 'undefined') {
        let name = await web3.eth.call({ to: token.hash, data: tokenFuncs['name']})
        name = web3.utils.hexToUtf8(name)
        console.log('name: ', name, JSON.stringify(name))
        token.name = name
    }

    if (!token.symbol) {
        let symbol = await web3.eth.call({ to: token.hash, data: tokenFuncs['symbol'] })
        symbol = trimWord(web3.utils.hexToUtf8(symbol))
        console.log('symbol: ', symbol)
        token.symbol = symbol
    }

    if (!token.decimals) {
        let decimals = await web3.eth.call({ to: token.hash, data: tokenFuncs['decimals'] })
        decimals = web3.utils.hexToNumberString(decimals)
        console.log('decimals: ', decimals)
        token.decimals = decimals
    }

    let totalSupply = await web3.eth.call({ to: token.hash, data: tokenFuncs['totalSupply'] })
    totalSupply = web3.utils.hexToNumberString(totalSupply).trim()
    console.log('total supply: ', totalSupply)
    token.totalSupply = totalSupply
    token.totalSupplyNumber = totalSupply

    token.status = true
    token.save()
    console.log('Update token successful: ', JSON.stringify(token))

    done()


}

module.exports = consumer
