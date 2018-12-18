import { Router } from 'express'
import { paginate } from '../helpers/utils'
import db from '../models'
const BigNumber = require('bignumber.js')
const logger = require('../helpers/logger')

const RewardController = Router()

RewardController.get('/rewards/:slug', async (req, res) => {
    try {
        let address = req.params.slug
        address = address.toLowerCase()
        let params = {}
        if (address) {
            params.query = { address: address }
        }

        let acc = await db.SpecialAccount.findOne({ hash: address })
        let total = null
        if (acc) {
            total = acc.rewardCount
        }
        params.sort = { epoch: -1 }
        let data = await paginate(req, 'Reward', params, total)

        return res.json(data)
    } catch (e) {
        logger.warn(e)
        return res.status(500).send()
    }
})

RewardController.get('/rewards/epoch/:epochNumber', async (req, res) => {
    try {
        let epochNumber = req.params.epochNumber || 0
        let params = {}
        params.query = { epoch: epochNumber }
        params.sort = { rewardTime: -1 }
        let data = await paginate(req, 'Reward', params)

        return res.json(data)
    } catch (e) {
        logger.warn(e)
        return res.status(500).send()
    }
})

RewardController.get('/rewards/total/:slug/:fromEpoch/:toEpoch', async (req, res) => {
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
        return res.status(500).send()
    }
})

RewardController.post('/expose/rewards', async (req, res) => {
    try {
        const address = req.body.address || null
        const owner = req.body.owner || null
        const limit = !isNaN(req.body.limit) ? parseInt(req.body.limit) : 0
        const reason = req.body.reason || null
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

        const reward = await db.Reward.find(params).sort({ _id: -1 }).limit(limit)

        res.send(reward)
    } catch (e) {
        logger.warn(e)
        return res.status(500).send()
    }
})

export default RewardController
