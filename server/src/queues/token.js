'use strict'

import TokenRepository from "../repositories/TokenRepository";

const config = require('config')
import Web3Util from '../helpers/web3'
import Token from '../models/Token'
import { formatAscIIJSON, trimWord } from '../helpers/utils'
import TokenTx from '../models/TokenTx'
import CrawlRepository from './CrawlRepository'
const q = require('../queues')

const consumer = {}
consumer.name = 'TokenProcess'
consumer.processNumber = 1
consumer.task = async function(job, done) {
    let address = job.data.address

    let token = await Token.findOne({ hash: address })
    if (!token) {
        return false
    }
    let tokenFuncs = TokenRepository.getTokenFuncs()

    let web3 = await Web3Util.getWeb3()
    if (typeof token.name === 'undefined') {
        let name = await web3.eth.call(
            { to: token.hash, data: tokenFuncs['name'] })
        token.name = trimWord(web3.utils.hexToUtf8(name))
    }

    if (typeof token.symbol === 'undefined') {
        let symbol = await web3.eth.call(
            { to: token.hash, data: tokenFuncs['symbol'] })
        token.symbol = trimWord(web3.utils.hexToUtf8(symbol))
    }

    if (typeof token.decimals === 'undefined') {
        let decimals = await web3.eth.call(
            { to: token.hash, data: tokenFuncs['decimals'] })
        token.decimals = web3.utils.hexToNumberString(decimals)
    }

    let totalSupply = await web3.eth.call(
        { to: token.hash, data: tokenFuncs['totalSupply'] })
    totalSupply = web3.utils.hexToNumberString(totalSupply).trim()
    token.totalSupply = totalSupply
    token.totalSupplyNumber = totalSupply

    token.status = true
    token.save()

}