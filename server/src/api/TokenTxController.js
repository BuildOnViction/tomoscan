import { Router } from 'express'
import db from '../models'
import { paginate } from '../helpers/utils'
import TokenTransactionHelper from '../helpers/tokenTransaction'
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')

const TokenTxController = Router()

TokenTxController.get('/token-txs', [
    check('limit').isInt({ lt: 30 }).withMessage('Limit is less than 30 items per page'),
    check('page').isInt().withMessage('Require page is number'),
    check('address').isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('token').isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let token = req.query.token
    let address = req.query.address
    try {
        let params = {}
        params.query = {}
        let total = null
        if (token) {
            params.query = { address: token.toLowerCase() }

            let tk = await db.SpecialAccount.findOne({ hash: token.toLowerCase() })
            if (tk) {
                total = tk.txCount
            }
        }
        if (address) {
            params.query = Object.assign(params.query,
                { $or: [{ from: address.toLowerCase() }, { to: address.toLowerCase() }] })
        }
        params.populate = [{ path: 'block' }]
        let data = await paginate(req, 'TokenTx', params, total)

        let items = data.items
        if (items.length) {
            items = await TokenTransactionHelper.formatTokenTransaction(items)
        }
        data.items = items

        return res.json(data)
    } catch (e) {
        logger.warn('Get list token tx: token %s | address %s error %s', token, address, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

export default TokenTxController
