import { Router } from 'express'
import { paginate } from '../helpers/utils'
import db from '../models'

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

export default RewardController
