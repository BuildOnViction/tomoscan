const { Router } = require('express')
const db = require('../models')
const { paginate } = require('../helpers/utils')
const TokenTransactionHelper = require('../helpers/tokenTransaction')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')

const TokenTxController = Router()

TokenTxController.get('/token-txs', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number'),
    check('address').optional().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('token').optional().isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.')
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

            let tk = await db.Account.findOne({ hash: token.toLowerCase() })
            if (tk) {
                total = tk.totalTxCount
            }
        }
        if (address) {
            params.query = Object.assign(params.query,
                { $or: [{ from: address.toLowerCase() }, { to: address.toLowerCase() }] })
            total = null
        }
        params.sort = { blockNumber: -1 }
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

TokenTxController.get('/token-txs/trc21', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number'),
    check('address').optional().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('token').optional().isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.')
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

            let tk = await db.Account.findOne({ hash: token.toLowerCase() })
            if (tk) {
                total = tk.totalTxCount
            }
        }
        if (address) {
            params.query = Object.assign(params.query,
                { $or: [{ from: address.toLowerCase() }, { to: address.toLowerCase() }] })
            total = null
        }
        params.sort = { blockNumber: -1 }
        let data = await paginate(req, 'TokenTrc21Tx', params, total)

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
TokenTxController.get('/token-txs/nft', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number'),
    check('address').optional().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('token').optional().isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.')
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

            let tk = await db.Account.findOne({ hash: token.toLowerCase() })
            if (tk) {
                total = tk.totalTxCount
            }
        }
        if (address) {
            params.query = Object.assign(params.query,
                { $or: [{ from: address.toLowerCase() }, { to: address.toLowerCase() }] })
        }
        params.sort = { blockNumber: -1 }
        let data = await paginate(req, 'TokenNftTx', params, total)

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

module.exports = TokenTxController
