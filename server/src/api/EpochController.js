const { Router } = require('express')
const db = require('../models')
const Web3Util = require('../helpers/web3')
const config = require('config')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')
const utils = require('../helpers/utils')

const EpochController = Router()

EpochController.get('/epochs', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        const web3 = await Web3Util.getWeb3()
        let lastBlock = await web3.eth.getBlockNumber()
        let lastEpoch = Math.floor(lastBlock / config.get('BLOCK_PER_EPOCH'))

        let params = { sort: { epoch: -1 }, query: { isActive: true } }
        let data = await utils.paginate(req, 'Epoch', params, lastEpoch)
        data.lastBlock = lastBlock
        data.lastEpoch = lastEpoch
        if (data.pages > 500) {
            data.pages = 500
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
    let lastEpoch = Math.ceil(lastBlock / config.get('BLOCK_PER_EPOCH')) - 1
    let epoch = await db.Epoch.findOne({ epoch: epochNumber })
    if (!epoch) {
        return res.status(404).json({ errors: { message: 'Epoch is not found or does not finish!' } })
    }
    let masterNodeNumber = await db.Reward.distinct('validator', { epoch: epochNumber })
    let rewardVoter = await db.Reward.countDocuments({ epoch: epochNumber, reason: { $ne: 'Foundation' } })
    let rewardFoundation = await db.Reward.countDocuments({ epoch: epochNumber, reason: 'Foundation' })

    return res.json({
        epoch: epochNumber,
        startBlock: epoch.startBlock,
        endBlock: epoch.endBlock,
        masterNodeNumber: epoch.masterNodeNumber,
        masterNode: masterNodeNumber,
        slashedNode: epoch.slashedNode,
        voterNumber: epoch.voterNumber,
        rewardVoter: rewardVoter,
        rewardFoundation: rewardFoundation,
        startTime: epoch.startTime,
        endTime: epoch.endTime,
        lastEpoch: lastEpoch
    })
})

module.exports = EpochController
