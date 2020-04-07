const { Router } = require('express')
const Web3Util = require('../helpers/web3')
const config = require('config')
const contractAddress = require('../contracts/contractAddress')
const BigNumber = require('bignumber.js')
const q = require('../queues')

const HomeController = Router()

HomeController.get('/circulatingSupply', async (req, res) => {
    const web3 = await Web3Util.getWeb3()
    const foundationBalance = await web3.eth.getBalance(contractAddress.TomoFoundation)
    const teamBalance = await web3.eth.getBalance(contractAddress.TomoTeam)
    const lastBlock = await web3.eth.getBlockNumber()
    const totalEpoch = Math.ceil(lastBlock / config.get('BLOCK_PER_EPOCH'))
    const totalReward = new BigNumber((totalEpoch - 1) * config.get('REWARD'))
    let circulatingSupply = new BigNumber(83 * 10 ** 6)
    circulatingSupply = circulatingSupply.multipliedBy(10 ** 18)
        .plus(totalReward.multipliedBy(10 ** 18)).minus(foundationBalance).minus(teamBalance)

    const circulatingNumber = circulatingSupply.dividedBy(10 ** 18)

    const maxSupply = 100 * 10 ** 6
    return res.json({ circulatingSupply: circulatingNumber.toNumber(), maxSupply: maxSupply })
})

HomeController.get('/jobNumber', async (req, res) => {
    const countJobs = () => {
        return new Promise((resolve, reject) => {
            q.inactiveCount((err, l) => {
                if (err) {
                    return reject(err)
                }
                return resolve(l)
            })
        })
    }
    return res.json({ jobNumber: await countJobs() })
})

module.exports = HomeController
