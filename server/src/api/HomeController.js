import { Router } from 'express'
import Web3Util from '../helpers/web3'
const config = require('config')
const contractAddress = require('../contracts/contractAddress')
const BigNumber = require('bignumber.js')

const HomeController = Router()

HomeController.get('/circulatingSupply', async (req, res) => {
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

export default HomeController
