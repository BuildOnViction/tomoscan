'use strict'

const Web3Util = require('../helpers/web3')
const TokenHelper = require('../helpers/token')
const utils = require('../helpers/utils')
const db = require('../models')
const BigNumber = require('bignumber.js')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'TokenProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let address = job.data.address.toLowerCase()
    logger.info('Process token: %s', address)
    try {
        let token = await db.Token.findOneAndUpdate({ hash: address }, { hash: address }, { upsert: true, new: true })
        let tokenFuncs = await TokenHelper.getTokenFuncs()

        let web3 = await Web3Util.getWeb3()

        if (!token.name) {
            let name = await web3.eth.call({ to: token.hash, data: tokenFuncs['name'] })
            name = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(name))
            token.name = name
        }

        if (!token.symbol) {
            let symbol = await web3.eth.call({ to: token.hash, data: tokenFuncs['symbol'] })
            symbol = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(symbol))
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

        // Check token type
        let code = await web3.eth.getCode(address)
        token.type = await TokenHelper.checkTokenType(code)
        token.isMintable = await TokenHelper.checkMintable(code)

        let totalSupply = await web3.eth.call({ to: token.hash, data: tokenFuncs['totalSupply'] })
        totalSupply = await web3.utils.hexToNumberString(totalSupply).trim()
        token.totalSupply = totalSupply
        token.totalSupplyNumber = new BigNumber(totalSupply).div(10 ** parseInt(token.decimals))

        token.status = true
        token.save()
    } catch (e) {
        logger.warn('cannot process token %s. Error %s', address, e)
        return done(e)
    }

    return done()
}

module.exports = consumer
