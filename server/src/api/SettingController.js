const { Router } = require('express')
const axios = require('axios')
const db = require('../models')
const Web3Util = require('../helpers/web3')
const logger = require('../helpers/logger')
const apiCacheWithRedis = require('../middlewares/apicache')

const SettingController = Router()
var tomoUsd = {}

SettingController.get('/setting', async (req, res) => {
    try {
    // Get total blocks in db.
        let web3 = await Web3Util.getWeb3()
        let blk = await web3.eth.getBlock('latest')
        let totalBlock = (blk || {}).number || await db.Block.estimatedDocumentCount()
        let totalAddress = await db.Account.estimatedDocumentCount()
        let totalToken = await db.Token.estimatedDocumentCount()
        let totalSmartContract = await db.Contract.estimatedDocumentCount()
        let lastBlock = await db.Block.findOne().sort({ number: -1 })

        return res.json(
            {
                stats: { totalBlock, totalAddress, totalToken, totalSmartContract, lastBlock }
            })
    } catch (e) {
        logger.warn(e)
        return res.status(400).send()
    }
})

SettingController.get('/setting/usd', apiCacheWithRedis('10 minutes'), async (req, res) => {
    try {
        let url = 'https://api.coingecko.com/api/v3/simple/price?ids=tomochain&vs_currencies=usd'
        let { data } = await axios.get(url, { timeout: 5000 })
        tomoUsd = data
    } catch (e) {
        logger.warn(e)
    }
    return res.json(tomoUsd)
})

module.exports = SettingController
