const { Router } = require('express')
const utils = require('../helpers/utils')
const LogHelper = require('../helpers/log')
const db = require('../models')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')

const LogController = Router()

LogController.get('/logs', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
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

            let acc = await db.Account.findOne({ hash: address })
            if (acc) {
                total = acc.logCount || 0
            }
        }
        let tx = req.query.tx
        if (tx) {
            tx = tx.toLowerCase()
            params.query = { transactionHash: tx }
        }
        params.sort = { _id: -1 }
        let data = await utils.paginate(req, 'Log', params, total)
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

module.exports = LogController
