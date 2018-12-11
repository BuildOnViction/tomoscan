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

SettingController.get('/setting/circulatingSupply', async (req, res) => {
    const web3 = await Web3Util.getWeb3()
    let foundationBalance = await web3.eth.getBalance(contractAddress.foundation)
    let teamBalance = await web3.eth.getBalance(contractAddress.team)
    let lastBlock = await web3.eth.getBlockNumber()
    let totalEpoch = Math.ceil(lastBlock / config.get('BLOCK_PER_EPOCH'))
    let totalReward = new BigNumber((totalEpoch - 1) * config.get('REWARD'))
    let circulatingSupply = new BigNumber(83 * 10 ** 6)
    circulatingSupply = circulatingSupply.multipliedBy(10 ** 18)
        .plus(totalReward.multipliedBy(10 ** 18)).minus(foundationBalance).minus(teamBalance)

    let circulatingNumber = circulatingSupply.dividedBy(10 ** 18)

    let maxSupply = 100 * 10 ** 6
    return res.json({ circulatingSupply: circulatingNumber.toNumber(), maxSupply: maxSupply })
})

export default SettingController
