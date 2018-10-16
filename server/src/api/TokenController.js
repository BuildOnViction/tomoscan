import { Router } from 'express'
import { paginate } from '../helpers/utils'
import db from '../models'
import TokenHelper from '../helpers/token'

const TokenController = Router()

TokenController.get('/tokens', async (req, res) => {
    try {
        let data = await paginate(req, 'Token',
            { sort: { createdAt: -1 } })

        for (let i = 0; i < data.items.length; i++) {
            let item = data.items[i]
            data.items[i] = await TokenHelper.formatToken(item)
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
        let hash = req.params.slug.toLowerCase()
        let token = await db.Token.findOne({ hash: hash }).lean()
        if (!token) {
            return res.status(404).send()
        }

        token = await TokenHelper.formatToken(token)
        let tokenInfo = await db.TokenInfo.findOne({ hash: hash })
        token.moreInfo = tokenInfo

        res.json(token)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

TokenController.get('/tokens/:token/holder/:holder', async (req, res) => {
    try {
        let token = req.params.token.toLowerCase()
        let holder = req.params.holder.toLowerCase()
        let tokenHolder = await db.TokenHolder.findOne({ hash: holder, token: token })
        if (!tokenHolder) {
            return res.status(404).send()
        }

        res.json(tokenHolder)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

TokenController.post('/tokens/:token/updateInfo', async (req, res) => {
    try {
        let hash = req.params.token.toLowerCase()
        let token = await db.Token.findOne({ hash: hash })
        if (!token) {
            return res.status(404).send()
        }
        let body = req.body

        await db.TokenInfo.findOneAndUpdate({ hash: hash }, body, { upsert: true, new: true })

        res.json({ message: 'Update successful' })
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(406).send()
    }
})

export default TokenController
