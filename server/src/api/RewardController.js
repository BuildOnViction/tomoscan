import { Router } from 'express'
import { paginate } from '../helpers/utils'
import AccountRepository from '../repositories/AccountRepository'

const RewardController = Router()

RewardController.get('/rewards', async (req, res) => {
    try {
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

export default RewardController
