import { Router } from 'express'
import { paginate } from '../helpers/utils'
import db from '../models'
import TokenHelper from '../helpers/token'
import Web3Util from '../helpers/web3'
const logger = require('../helpers/logger')

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
        logger.warn(e)
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
        token.moreInfo = await db.TokenInfo.findOne({ hash: hash })

        res.json(token)
    } catch (e) {
        logger.warn(e)
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
        logger.warn(e)
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
        // verify sign message second time
        let web3 = await Web3Util.getWeb3()
        const signedMessage = req.body.signData.sigMessage || ''
        const signature = req.body.signData.sigHash || ''

        let acc = await db.Account.findOne({ hash: hash })

        let result = await web3.eth.accounts.recover(signedMessage, signature)

        if (acc.contractCreation === result.toLowerCase()) {
            let body = req.body.data

            await db.TokenInfo.updateOne({ hash: hash }, body, { upsert: true, new: true })

            res.json({ message: 'Update successful' })
        } else {
            return res.status(406).send('Unacceptable sign message')
        }
    } catch (e) {
        logger.warn(e)
        return res.status(406).send()
    }
})

export default TokenController
