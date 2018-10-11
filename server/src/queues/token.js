'use strict'

import Web3Util from '../helpers/web3'
import TokenHelper from '../helpers/token'
import { trimWord } from '../helpers/utils'
const db = require('../models')
const BigNumber = require('bignumber.js')

const consumer = {}
consumer.name = 'TokenProcess'
consumer.processNumber = 6
consumer.task = async function (job, done) {
    let address = job.data.address.toLowerCase()
    console.log('Process token: ', address)
    try {
        let token = await db.Token.findOneAndUpdate({ hash: address }, { hash: address }, { upsert: true, new: true })
        let tokenFuncs = await TokenHelper.getTokenFuncs()

        let web3 = await Web3Util.getWeb3()

        if (!token.name) {
            let name = await web3.eth.call({ to: token.hash, data: tokenFuncs['name'] })
            name = await trimWord(await web3.utils.hexToUtf8(name))
            token.name = name
        }

        if (!token.symbol) {
            let symbol = await web3.eth.call({ to: token.hash, data: tokenFuncs['symbol'] })
            symbol = await trimWord(await web3.utils.hexToUtf8(symbol))
            token.symbol = symbol
        }

        if (!token.decimals) {
            let decimals = await web3.eth.call({ to: token.hash, data: tokenFuncs['decimals'] })
            decimals = await web3.utils.hexToNumberString(decimals)
            token.decimals = decimals
        }

        if (!token.txCount) {
            token.txCount = 0
        }

        let totalSupply = await web3.eth.call({ to: token.hash, data: tokenFuncs['totalSupply'] })
        totalSupply = await web3.utils.hexToNumberString(totalSupply).trim()
        token.totalSupply = totalSupply
        token.totalSupplyNumber = new BigNumber(totalSupply).div(10 ** parseInt(token.decimals))

        token.status = true
        token.save()
    } catch (e) {
        console.error(consumer.name, address, e)
        done(e)
    }

    done()
}

module.exports = consumer
