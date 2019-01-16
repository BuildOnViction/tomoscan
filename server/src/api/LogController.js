import { Router } from 'express'
import { paginate } from '../helpers/utils'
import LogHelper from '../helpers/log'
import db from '../models'
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')

const LogController = Router()

LogController.get('/logs', [
    check('limit').isInt({ lt: 30 }).withMessage('Limit is less than 30 items per page'),
    check('page').isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let address = req.query.address
        let params = {}

        let total = null
        if (address) {
            address = address.toLowerCase()
            params.query = { address: address }

            let acc = await db.SpecialAccount.findOne({ hash: address })
            if (acc) {
                total = acc.logCount
            }
        }
        let tx = req.query.tx
        if (tx) {
            tx = tx.toLowerCase()
            params.query = { transactionHash: tx }
        }
        params.sort = { _id: -1 }
        let data = await paginate(req, 'Log', params, total)
        let items = data.items
        for (let i = 0; i < items.length; i++) {
            data.items[i] = await LogHelper.formatLog(items[i])
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Error get list logs %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

export default LogController
