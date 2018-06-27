import { Router } from 'express'
import Block from '../models/Block'
import Account from '../models/Account'
import Token from '../models/Token'
import axios from 'axios'
import Contract from '../models/Contract'

const SettingController = Router()

SettingController.get('/setting', async (req, res, next) => {
    try {
    // Get total blocks in db.
        let totalBlock = await Block.find().count()
        let totalAddress = await Account.find({ status: true }).count()
        let totalToken = await Token.find({ status: true }).count()
        let totalSmartContract = await Contract.find().count()
        let lastBlock = await Block.findOne().sort({ number: -1 })

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
      process.env.CMC_ID + '/?convert=USD')

        return res.json(data)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

export default SettingController
