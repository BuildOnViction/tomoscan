import { Router } from 'express'
import axios from 'axios'
import db from '../models'
import Web3Util from '../helpers/web3'
const config = require('config')
const contractAddress = require('../contracts/contractAddress')
const BigNumber = require('bignumber.js')

const SettingController = Router()

SettingController.get('/setting', async (req, res, next) => {
    try {
    // Get total blocks in db.
        let web3 = await Web3Util.getWeb3()
        let blk = await web3.eth.getBlock('latest')
        let totalBlock = (blk || {}).number || await db.Block.countDocuments()
        let totalAddress = await db.Account.countDocuments({ status: true })
        let totalToken = await db.Token.countDocuments({ status: true })
        let totalSmartContract = await db.Contract.countDocuments()
        let lastBlock = await db.Block.findOne().sort({ number: -1 })

        return res.json(
            {
                stats: { totalBlock, totalAddress, totalToken, totalSmartContract, lastBlock }
            })
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

SettingController.get('/setting/usd', async (req, res, next) => {
    try {
        let { data } = await axios.get('https://api.coinmarketcap.com/v2/ticker/' +
            config.get('CMC_ID') + '/?convert=USD')

        return res.json(data)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

export default SettingController
