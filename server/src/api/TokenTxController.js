const { Router } = require('express')
const db = require('../models')
const { paginate } = require('../helpers/utils')
const TokenTransactionHelper = require('../helpers/tokenTransaction')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')

const TokenTxController = Router()

TokenTxController.get('/token-txs', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500'),
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
        if (data.pages > 500) {
            data.pages = 500
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list token tx: token %s | address %s error %s', token, address, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TokenTxController.get('/token-txs/:tokenType', [
    check('tokenType').exists().isString().withMessage('trc20/trc21/trc721'),
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500'),
    check('holder').optional().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('token').optional().isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let token = req.query.token
    let holder = req.query.holder
    let tokenType = req.params.tokenType
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
        if (holder) {
            params.query = Object.assign(params.query,
                { $or: [{ from: holder.toLowerCase() }, { to: holder.toLowerCase() }] })
            total = null
        }
        params.sort = { blockNumber: -1 }
        let data
        if (tokenType === 'trc20') {
            data = await paginate(req, 'TokenTx', params, total)
        } else if (tokenType === 'trc21') {
            data = await paginate(req, 'TokenTrc21Tx', params, total)
        } else if (tokenType === 'trc721') {
            data = await paginate(req, 'TokenNftTx', params, total)
        } else {
            data = {
                total: total,
                perPage: parseInt(req.query.limit) || 25,
                currentPage: parseInt(req.query.page) || 1,
                pages: 0,
                items: []
            }
        }

        let items = data.items
        if (items.length) {
            items = await TokenTransactionHelper.formatTokenTransaction(items)
        }
        data.items = items
        if (data.pages > 500) {
            data.pages = 500
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list token tx: token %s | holder %s error %s', token, holder, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TokenTxController.get('/token-txs/:tokenType/:txHash', [
    check('tokenType').exists().isString().withMessage('trc20/trc21/trc721'),
    check('txHash').exists().isString().withMessage('transaction hash'),
    check('holder').optional().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let holder = req.query.holder
    let tokenType = req.params.tokenType
    let txHash = req.params.txHash
    let tx = await db.Tx.findOne({ hash: txHash })
    if (!tx) {
        return res.status(404).json({ errors: { message: 'Tx hash does not exist!' } })
    }
    try {
        let params = {}
        params.query = { transactionHash: txHash }
        if (holder) {
            params.query = Object.assign(params.query,
                { $or: [{ from: holder.toLowerCase() }, { to: holder.toLowerCase() }] })
        }
        params.sort = { blockNumber: -1 }
        let data
        if (tokenType === 'trc20') {
            data = await paginate(req, 'TokenTx', params, null)
        } else if (tokenType === 'trc21') {
            data = await paginate(req, 'TokenTrc21Tx', params, null)
        } else if (tokenType === 'trc721') {
            data = await paginate(req, 'TokenNftTx', params, null)
        } else {
            data = {
                total: 0,
                perPage: parseInt(req.query.limit) || 25,
                currentPage: parseInt(req.query.page) || 1,
                pages: 0,
                items: []
            }
        }

        let items = data.items
        if (items.length) {
            items = await TokenTransactionHelper.formatTokenTransaction(items)
        }
        data.items = items
        data.transaction = tx
        if (data.pages > 500) {
            data.pages = 500
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list token tx of hash %s | holder %s error %s', txHash, holder, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

module.exports = TokenTxController
