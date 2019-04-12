const { Router } = require('express')
const db = require('../models')
const Web3Util = require('../helpers/web3')
const config = require('config')
const logger = require('../helpers/logger')
const BlockHelper = require('../helpers/block')
const axios = require('axios')
const urlJoin = require('url-join')
const { check, validationResult } = require('express-validator/check')

const EpochController = Router()

EpochController.get('/epochs', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let perPage = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1

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
            total: lastEpoch,
            perPage: perPage,
            currentPage: page,
            pages: Math.ceil(lastEpoch / perPage),
            items: listEpoch
        }
        return res.json(data)
    } catch (e) {
        logger.warn('Error get list epochs %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

EpochController.get('/epochs/:slug', [
    check('slug').exists().withMessage('Epoch number is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let epochNumber = req.params.slug
    const web3 = await Web3Util.getWeb3()
    let lastBlock = await web3.eth.getBlockNumber()
    let lastEpoch = Math.ceil(lastBlock / config.get('BLOCK_PER_EPOCH'))
    if (epochNumber > lastEpoch) {
        return res.status(404).json({ errors: { message: 'Epoch is not found or does not finish!' } })
    }
    let endBlock = epochNumber * config.get('BLOCK_PER_EPOCH')
    let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1
    let masterNodeNumber = await db.Reward.distinct('validator', { epoch: epochNumber })
    let voterNumber = await db.Reward.distinct('address', { epoch: epochNumber })
    let rewardVoter = await db.Reward.countDocuments({ epoch: epochNumber, reason: { $ne: 'Foundation' } })
    let rewardFoundation = await db.Reward.countDocuments({ epoch: epochNumber, reason: 'Foundation' })

    let sBlock = await BlockHelper.getBlockDetail(startBlock)
    let eBlock = await BlockHelper.getBlockDetail(endBlock)

    const tomomasterUrl = config.get('TOMOMASTER_API_URL')
    const { data } = await axios.get(urlJoin(tomomasterUrl, '/api/candidates/slashed/', epochNumber))

    return res.json({
        epoch: epochNumber,
        startBlock: startBlock,
        endBlock: endBlock,
        masterNodeNumber: masterNodeNumber.length,
        masterNode: masterNodeNumber,
        slashedNode: data.penalties,
        voterNumber: voterNumber.length,
        rewardVoter: rewardVoter,
        rewardFoundation: rewardFoundation,
        startTime: sBlock.timestamp,
        endTime: (eBlock || { timestamp: null }).timestamp,
        lastEpoch: lastEpoch
    })
})

module.exports = EpochController
