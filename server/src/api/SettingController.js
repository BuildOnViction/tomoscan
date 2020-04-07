const { Router } = require('express')
const axios = require('axios')
const db = require('../models')
const Web3Util = require('../helpers/web3')
const logger = require('../helpers/logger')
const redisHelper = require('../helpers/redis')

const SettingController = Router()
var tomoUsd = {}

SettingController.get('/setting', async (req, res) => {
    try {
    // Get total blocks in db.
        const web3 = await Web3Util.getWeb3()
        const blk = await web3.eth.getBlock('latest')
        const totalBlock = (blk || {}).number || await db.Block.estimatedDocumentCount()
        const totalAddress = await db.Account.estimatedDocumentCount()
        const totalToken = await db.Token.estimatedDocumentCount()
        const totalSmartContract = await db.Contract.estimatedDocumentCount()
        const lastBlock = await db.Block.findOne().sort({ number: -1 })

        return res.json(
            {
                stats: { totalBlock, totalAddress, totalToken, totalSmartContract, lastBlock }
            })
    } catch (e) {
        logger.warn(e)
        return res.status(400).send()
    }
})

SettingController.get('/setting/usd', async (req, res) => {
    try {
        const cache = await redisHelper.get('tomo-price')
        if (cache !== null) {
            const r = JSON.parse(cache)
            logger.info('load tomo price from cache')
            return res.json(r)
        }
        const url = 'https://api.coingecko.com/api/v3/simple/price?ids=tomochain&vs_currencies=usd'

        const { data } = await axios.get(url, { timeout: 5000 })

        tomoUsd = data
        await redisHelper.set('tomo-price', JSON.stringify(data), 10 * 60)
    } catch (e) {
        logger.warn(e)
    }
    return res.json(tomoUsd)
})

module.exports = SettingController
