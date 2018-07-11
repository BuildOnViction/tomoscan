import { Router } from 'express'
import { paginate } from '../helpers/utils'
import Token from '../models/Token'
import TokenRepository from '../repositories/TokenRepository'

const TokenController = Router()

TokenController.get('/tokens', async (req, res) => {
    try {
        let data = await paginate(req, 'Token',
            { sort: { totalSupply: -1 } })

        for (let i = 0; i < data.items.length; i++) {
            let item = data.items[i]
            data.items[i] = await TokenRepository.formatItem(item)
        }

        return res.json(data)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

TokenController.get('/tokens/:slug', async (req, res) => {
    try {
        let hash = req.params.slug
        let token = await Token.findOne({ hash: hash }).lean()
        if (!token) {
            return res.status(404).send()
        }

        token = await TokenRepository.formatItem(token)

        res.json(token)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

export default TokenController
