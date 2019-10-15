const { Router } = require('express')
const { paginate } = require('../helpers/utils')
const db = require('../models')
const BigNumber = require('bignumber.js')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')
const config = require('config')
const Web3Util = require('../helpers/web3')

const RewardController = Router()

RewardController.get('/rewards/:slug', [
    check('limit').optional().isInt({ max: 100 }).withMessage('Limit is less than 100 items per page'),
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500'),
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let address = req.params.slug
    address = address.toLowerCase()
    try {
        let params = {}
        if (address) {
            params.query = { address: address }
        }

        let acc = await db.Account.findOne({ hash: address })
        let total = null
        if (acc) {
            total = acc.rewardCount
        }
        params.sort = { epoch: -1 }
        let data = await paginate(req, 'Reward', params, total)
        if (data.pages > 500) {
            data.pages = 500
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Cannot find reward of address %s. Error %s', address, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

RewardController.get('/rewards/alerts/status', [], async (req, res) => {
    let web3 = await Web3Util.getWeb3()
    let lastBlock = await web3.eth.getBlockNumber()
    let currentEpoch = Math.floor(lastBlock / config.get('BLOCK_PER_EPOCH'))
    let lastEpochReward = currentEpoch - 1
    let checkExistOnDb = await db.Reward.find({ epoch: lastEpochReward }).limit(1)

    let slow = false

    if (checkExistOnDb.length === 0 && (lastBlock - currentEpoch * config.get('BLOCK_PER_EPOCH')) >= 150) {
        slow = true
    }
    return res.json({
        lastBlock: lastBlock,
        currentEpoch: Math.ceil(lastBlock / config.get('BLOCK_PER_EPOCH')),
        lastEpochReward: lastEpochReward,
        isSlow: slow
    })
})

RewardController.get('/rewards/epoch/:epochNumber', [
    check('limit').optional().isInt({ max: 100 }).withMessage('Limit is less than 100 items per page'),
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500'),
    check('epochNumber').isInt().exists().withMessage('Epoch number is require')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let epochNumber = req.params.epochNumber || 0
    try {
        let params = {}
        params.query = { epoch: epochNumber }
        let reason = req.query.reason
        if (reason === 'voter') {
            params.query = Object.assign({}, params.query,
                { reason: { $ne: 'Foundation' } })
        } else if (reason === 'foundation') {
            params.query = Object.assign({}, params.query,
                { reason: 'Foundation' })
        }
        let data = await paginate(req, 'Reward', params)
        if (data.pages > 500) {
            data.pages = 500
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Cannot find reward of epoch %s. Error %s', epochNumber, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

RewardController.get('/rewards/total/:slug/:fromEpoch/:toEpoch', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('fromEpoch').exists().isInt().withMessage('From epoch is require'),
    check('toEpoch').exists().isInt().withMessage('To epoch is require')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let address = req.params.slug
        let fromEpoch = req.params.fromEpoch
        let toEpoch = req.params.toEpoch
        address = address.toLowerCase()
        let acc = await db.Account.findOne({ hash: address })
        if (!acc) {
            return res.json({ address: address, totalReward: 0 })
        }

        let rewards = await db.Reward.find({
            address: address,
            epoch: { $gte: fromEpoch, $lte: toEpoch }
        })
        let total = new BigNumber(0)
        for (let i = 0; i < rewards.length; i++) {
            let rw = new BigNumber(rewards[i].reward)
            rw = rw.dividedBy(10 ** 18)
            total = total.plus(rw)
        }

        return res.json({ address: address, totalReward: total.toNumber() })
    } catch (e) {
        logger.warn(e)
        return res.status(400).send()
    }
})
RewardController.post('/expose/rewards', async (req, res) => {
    try {
        const address = req.body.address || null
        const owner = req.body.owner || null
        const reason = req.body.reason || null
        let limit = !isNaN(req.body.limit) ? parseInt(req.body.limit) : 200
        if (limit > 200) {
            limit = 200
        }
        let page = !isNaN(req.body.page) ? parseInt(req.body.page) : 1
        const skip = limit * (page - 1)
        let params = {}

        if (owner) {
            params = {
                validator: address.toLowerCase(),
                address: owner.toLowerCase()
            }
        } else {
            params = {
                address: address.toLowerCase()
            }
        }

        if (reason) {
            params = Object.assign(params, { reason: reason })
        }
        const totalReward = db.Reward.countDocuments(params)

        const reward = await db.Reward.find(params).sort({ epoch: -1 }).limit(limit).skip(skip).exec()

        res.send({
            items: reward,
            total: await totalReward
        })
    } catch (e) {
        logger.warn(e)
        return res.status(400).send()
    }
})

RewardController.post('/expose/MNRewardsByEpochs', [
    check('address').exists().withMessage('Account address is required.'),
    check('owner').exists().withMessage('owner is required'),
    check('reason').exists().withMessage('reason is required'),
    check('epoch').exists().withMessage('epoch is required')
], async (req, res) => {
    try {
        const address = req.body.address || null
        const owner = req.body.owner || null
        const reason = req.body.reason || null
        const epoch = req.body.epoch || []
        let params = {}

        if (reason) {
            params = Object.assign(params, { reason: reason })
        }

        const map = epoch.map(async (e) => {
            params = {
                validator: address.toLowerCase(),
                address: owner.toLowerCase(),
                reason: reason,
                epoch: e
            }
            const totalReward = new BigNumber(config.get('REWARD'))
            let result = await db.Reward.findOne(params).exec()

            if (result) {
                result = result.toObject()
                let signNumbers = await db.EpochSign.find({ epoch: e })

                let totalSign = 0
                let map = signNumbers.map(function (signNumber) {
                    totalSign += signNumber.signNumber
                })

                await Promise.all(map)
                if (totalSign > 0) {
                    result.masternodeReward = totalReward.multipliedBy(result.signNumber)
                        .dividedBy(totalSign).multipliedBy(0.4) // 40% for masternode
                } else result.masternodeReward = result.reward
                return result
            } else {
                return {
                    epoch: e
                }
            }
        })
        const r = await Promise.all(map)

        res.json(r)
    } catch (e) {
        logger.warn(e)
        return res.status(400).send()
    }
})

RewardController.post('/expose/signNumber/:epochNumber', [
    check('epochNumber').exists().isInt().withMessage('Epoch number is require & need a number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let epoch = req.params.epochNumber || null
        let signNumbers = await db.EpochSign.find({ epoch: epoch })

        return res.json(signNumbers)
    } catch (e) {
        logger.warn(e)
        return res.status(400).send()
    }
})

RewardController.post('/expose/totalSignNumber/:epochNumber', [
    check('epochNumber').exists().isInt().withMessage('Epoch number is require & need a number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let epoch = req.params.epochNumber || null
        let signNumbers = await db.EpochSign.find({ epoch: epoch })
        let totalSign = 0
        let map = signNumbers.map(function (signNumber) {
            totalSign += signNumber.signNumber
        })
        await Promise.all(map)

        return res.json({ epoch: epoch, totalSignNumber: totalSign })
    } catch (e) {
        logger.warn(e)
        return res.status(400).send()
    }
})

module.exports = RewardController
