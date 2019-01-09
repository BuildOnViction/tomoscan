import { Router } from 'express'
const db = require('../models')
const Web3Util = require('../helpers/web3')
const config = require('config')
const logger = require('../helpers/logger')
const BlockHelper = require('../helpers/block')

const EpochController = Router()

EpochController.get('/epochs', async (req, res, next) => {
    try {
        let perPage = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        perPage = Math.min(20, perPage)

        const web3 = await Web3Util.getWeb3()
        let lastBlock = await web3.eth.getBlockNumber()
        let lastEpoch = Math.floor(lastBlock / config.get('BLOCK_PER_EPOCH'))

        let listEpoch = []
        let fromEpoch = lastEpoch - (page - 1) * perPage
        let isFinish = false
        while (isFinish === false) {
            let endBlock = fromEpoch * config.get('BLOCK_PER_EPOCH')
            let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1
            listEpoch.push({
                epoch: fromEpoch,
                startBlock: startBlock,
                endBlock: endBlock
            })
            fromEpoch -= 1
            if (listEpoch.length === perPage) {
                isFinish = true
            } else if (fromEpoch === 0) {
                isFinish = true
            }
        }

        let data = {
            lastEpoch: lastEpoch,
            lastBlock: lastBlock,
            realTotal: lastEpoch,
            total: lastEpoch,
            perPage: perPage,
            currentPage: page,
            pages: Math.ceil(lastEpoch / perPage),
            items: listEpoch
        }
        return res.json(data)
    } catch (e) {
        logger.warn(e)
    }
})

EpochController.get('/epochs/:slug', async (req, res) => {
    let epochNumber = req.params.slug
    const web3 = await Web3Util.getWeb3()
    let lastBlock = await web3.eth.getBlockNumber()
    let lastEpoch = Math.ceil(lastBlock / config.get('BLOCK_PER_EPOCH'))
    if (epochNumber > lastEpoch) {
        return res.status(404).json({ message: 'Epoch is not found or does not finish!' })
    }
    let endBlock = epochNumber * config.get('BLOCK_PER_EPOCH')
    let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1
    let masterNodeNumber = await db.Reward.distinct('validator', { epoch: epochNumber })
    let voterNumber = await db.Reward.distinct('address', { epoch: epochNumber })
    let rewardVoter = await db.Reward.countDocuments({ epoch: epochNumber, reason: { $ne: 'Foundation' } })
    let rewardFoundation = await db.Reward.countDocuments({ epoch: epochNumber, reason: 'Foundation' })

    let sBlock = await BlockHelper.getBlockDetail(startBlock)
    let eBlock = await BlockHelper.getBlockDetail(endBlock)

    return res.json({
        epoch: epochNumber,
        startBlock: startBlock,
        endBlock: endBlock,
        masterNodeNumber: masterNodeNumber.length,
        masterNode: masterNodeNumber,
        voterNumber: voterNumber.length,
        rewardVoter: rewardVoter,
        rewardFoundation: rewardFoundation,
        startTime: sBlock.timestamp,
        endTime: (eBlock || { timestamp: null }).timestamp,
        lastEpoch: lastEpoch
    })
})

export default EpochController
