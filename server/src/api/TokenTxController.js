const { Router } = require('express')
const db = require('../models')
const { paginate } = require('../helpers/utils')
const TokenTransactionHelper = require('../helpers/tokenTransaction')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')
const config = require('config')
const elastic = require('../helpers/elastic')

const TokenTxController = Router()

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

    let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 25
    limit = Math.min(100, limit)
    let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
    try {
        let data
        if (!config.get('GetDataFromElasticSearch')) {
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
            if (tokenType === 'trc20') {
                data = await paginate(req, 'TokenTx', params, total)
            } else if (tokenType === 'trc21') {
                data = await paginate(req, 'TokenTrc21Tx', params, total)
            } else if (tokenType === 'trc721') {
                data = await paginate(req, 'TokenNftTx', params, total)
            } else {
                data = {
                    total: total,
                    perPage: limit,
                    currentPage: page,
                    pages: 0,
                    items: []
                }
            }
        } else {
            let eData = {}
            data = {
                total: 0,
                perPage: limit,
                currentPage: page,
                pages: 0,
                items: []
            }
            let query = {}
            if (token) {
                query.match = { address: token.toLowerCase() }
            }
            if (holder) {
                query.bool = {
                    should: [
                        { term: { from: holder.toLowerCase() } },
                        { term: { to: holder.toLowerCase() } }
                    ]
                }
            }
            if (tokenType === 'trc20') {
                eData = await elastic.search('trc20-tx', query, { blockNumber: 'desc' }, limit, page)
            } else if (tokenType === 'trc21') {
                eData = await elastic.search('trc21-tx', query, { blockNumber: 'desc' }, limit, page)
            } else if (tokenType === 'trc721') {
                eData = await elastic.search('trc721-tx', query, { blockNumber: 'desc' }, limit, page)
            } else {
                eData = {}
            }
            if (eData.hasOwnProperty('hits')) {
                let hits = eData.hits
                data.total = hits.total.value
                data.pages = Math.ceil(data.total / limit)
                let items = []
                for (let i = 0; i < hits.hits.length; i++) {
                    items.push(hits.hits[i]._source)
                }
                data.items = items
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
