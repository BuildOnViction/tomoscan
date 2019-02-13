import { Router } from 'express'
import { paginate } from '../helpers/utils'
import db from '../models'
import TokenHelper from '../helpers/token'
import Web3Util from '../helpers/web3'
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')

const TokenController = Router()

TokenController.get('/tokens', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let data = await paginate(req, 'Token',
            { sort: { createdAt: -1 } })

        for (let i = 0; i < data.items.length; i++) {
            let item = data.items[i]
            data.items[i] = await TokenHelper.formatToken(item)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list tokens error %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TokenController.get('/tokens/:slug', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug.toLowerCase()
    try {
        let token = await db.Token.findOne({ hash: hash }).lean()
        if (!token) {
            return res.status(404).json({ errors: { message: 'Token was not found' } })
        }

        token = await TokenHelper.formatToken(token)
        token.moreInfo = await db.TokenInfo.findOne({ hash: hash })

        res.json(token)
    } catch (e) {
        logger.warn('Get token %s detail error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TokenController.get('/tokens/:token/holder/:holder', [
    check('token').exists().isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.'),
    check('holder').exists().isLength({ min: 42, max: 42 }).withMessage('Holder address is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let token = req.params.token.toLowerCase()
        let holder = req.params.holder.toLowerCase()
        let tokenHolder = await db.TokenHolder.findOne({ hash: holder, token: token })
        if (!tokenHolder) {
            return res.status(400).json({ errors: { message: 'Token or holder was not found' } })
        }

        res.json(tokenHolder)
    } catch (e) {
        logger.warn('Get token holder error %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TokenController.post('/tokens/:token/updateInfo', [
    check('token').exists().isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.'),
    check('signData').exists().withMessage('Sign data is require'),
    check('data').exists().withMessage('Data is require')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.token.toLowerCase()
    try {
        let token = await db.Token.findOne({ hash: hash })
        if (!token) {
            return res.status(400).json({ errors: { message: 'Token was not found' } })
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
            return res.status(406).json({ errors: { message: 'Unacceptable sign message' } })
        }
    } catch (e) {
        logger.warn('update token %s info error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

export default TokenController
