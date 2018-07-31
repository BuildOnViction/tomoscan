'use strict'

import Web3Util from '../helpers/web3'
import TokenHelper from '../helpers/token'
import Token from '../models/Token'
import { formatAscIIJSON, trimWord } from '../helpers/utils'
const Web3 = require('web3')
const config = require('config')

const consumer = {}
consumer.name = 'TokenProcess'
consumer.processNumber = 2
consumer.task = async function(job, done) {
    let address = job.data.address
    console.log('Process token: ', address)
    let token = await Token.findOne({ hash: address })
    if (!token) {
        token = await Token.findOneAndUpdate({ hash: address },
            { hash: address, status: false }, { upsert: true, new: true })
    }
    let tokenFuncs = TokenHelper.getTokenFuncs()
    console.log('token funcs: ', tokenFuncs)
    console.log('tokenname is: ', token.name)

    // let web3 = await Web3Util.getWeb3()
    const web3 =  await new Web3(new Web3.providers.HttpProvider(config.get('WEB3_URI')))

    let name = await web3.eth.call(
        { to: token.hash, data: tokenFuncs['name']})
    name = web3.utils.hexToUtf8(name)
    console.log('name: ', name, JSON.stringify(name))
    token.name = web3.utils.hexToUtf8(name)
    console.log('tokenname2 is: ', token.name)

    if (!token.symbol) {
        let symbol = await web3.eth.call({ to: token.hash, data: tokenFuncs['symbol'] })
        token.symbol = trimWord(web3.utils.hexToUtf8(symbol))
    }

    if (!token.decimals) {
        let decimals = await web3.eth.call({ to: token.hash, data: tokenFuncs['decimals'] })
        token.decimals = web3.utils.hexToNumberString(decimals)
    }

    let totalSupply = await web3.eth.call({ to: token.hash, data: tokenFuncs['totalSupply'] })
    totalSupply = web3.utils.hexToNumberString(totalSupply).trim()
    token.totalSupply = totalSupply
    token.totalSupplyNumber = totalSupply

    token.status = true
    token.save()

    done()

}

module.exports = consumer
