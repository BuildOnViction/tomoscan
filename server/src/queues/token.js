'use strict'

const Web3Util = require('../helpers/web3')
const TokenHelper = require('../helpers/token')
const utils = require('../helpers/utils')
const db = require('../models')
const BigNumber = require('bignumber.js')
const logger = require('../helpers/logger')
const elastic = require('../helpers/elastic')

const consumer = {}
consumer.name = 'TokenProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    const address = job.data.address.toLowerCase()
    logger.info('Process token: %s', address)
    try {
        const token = await db.Token.findOneAndUpdate({ hash: address }, { hash: address }, { upsert: true, new: true })
        const tokenFuncs = await TokenHelper.getTokenFuncs()

        const web3 = await Web3Util.getWeb3()

        if (!token.name) {
            let name = await web3.eth.call({ to: token.hash, data: tokenFuncs.name })
            name = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(name))
            token.name = name
        }

        if (!token.symbol) {
            let symbol = await web3.eth.call({ to: token.hash, data: tokenFuncs.symbol })
            symbol = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(symbol))
            token.symbol = symbol
        }

        if (!token.decimals) {
            let decimals = await web3.eth.call({ to: token.hash, data: tokenFuncs.decimals })
            decimals = await web3.utils.hexToNumberString(decimals)
            token.decimals = decimals
        }

        if (!token.txCount) {
            token.txCount = 0
        }

        // Check token type
        const code = await web3.eth.getCode(address)
        token.type = await TokenHelper.checkTokenType(code)
        token.isMintable = await TokenHelper.checkMintable(code)

        let totalSupply = await web3.eth.call({ to: token.hash, data: tokenFuncs.totalSupply })
        totalSupply = await web3.utils.hexToNumberString(totalSupply).trim()
        token.totalSupply = totalSupply
        token.totalSupplyNumber = new BigNumber(totalSupply).div(10 ** parseInt(token.decimals))

        token.status = true
        await token.save()

        const t = token.toJSON()
        delete t._id
        delete t.id
        t.totalSupplyNumber = String(t.totalSupplyNumber)
        await elastic.index(t.hash, 'tokens', t)
    } catch (e) {
        logger.warn('cannot process token %s. Error %s', address, e)
        return done(e)
    }

    return done()
}

module.exports = consumer
