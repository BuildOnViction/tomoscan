import { Router } from 'express'
import { paginate } from '../helpers/utils'
import db from '../models'
const BigNumber = require('bignumber.js')

const RewardController = Router()

RewardController.get('/rewards/:slug', async (req, res) => {
    try {
        let address = req.params.slug
        address = address.toLowerCase()
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

        return res.json(data)
    } catch (e) {
        console.trace(e)
        console.log(e)
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
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

export default RewardController
