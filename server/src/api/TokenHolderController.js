const { Router } = require('express')
const { paginate } = require('../helpers/utils')
const db = require('../models')
const TokenHolderHelper = require('../helpers/tokenHolder')
const TokenHelper = require('../helpers/token')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')

const TokenHolderController = Router()

TokenHolderController.get('/token-holders', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number'),
    check('address').optional().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('hash').optional().isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const address = (req.query.address || '').toLowerCase()
    const hash = (req.query.hash || '').toLowerCase()
    try {
        const params = {}
        if (address) {
            params.query = { token: address }
        }
        if (hash) {
            params.query = { hash: hash }
        }
        params.sort = { quantityNumber: -1 }
        params.query = Object.assign(params.query, { quantityNumber: { $gt: 0 } })
        const data = await paginate(req, 'TokenHolder', params)

        const items = data.items
        if (items.length) {
            // Get token totalSupply.
            let totalSupply = null
            let decimals
            if (address) {
                const token = await db.Token.findOne({ hash: address })
                if (token) {
                    totalSupply = token.totalSupply
                    decimals = token.decimals
                }
            }
            const length = items.length
            const baseRank = (data.currentPage - 1) * data.perPage
            for (let i = 0; i < length; i++) {
                items[i] = await TokenHolderHelper.formatHolder(items[i], totalSupply, decimals)
                items[i].rank = baseRank + i + 1
            }

            // Get tokens.
            const tokenHashes = []
            for (let i = 0; i < length; i++) {
                tokenHashes.push(items[i].token)
            }
            const tokens = await db.Token.find({ hash: { $in: tokenHashes } })
            if (tokens.length) {
                for (let i = 0; i < length; i++) {
                    for (let j = 0; j < tokens.length; j++) {
                        if (items[i].token === tokens[j].hash) {
                            tokens[j].name = tokens[j]
                                .name
                                .replace(/\u0000/g, '') // eslint-disable-line no-control-regex
                                .trim()
                            tokens[j].symbol = tokens[j]
                                .symbol
                                .replace(/\u0004/g, '') // eslint-disable-line no-control-regex
                                .trim()
                            items[i].tokenObj = tokens[j]
                        }
                    }
                }
            }

            const map = items.map(async it => {
                const d = (it.tokenObj || {}).decimals || decimals
                const tk = await TokenHelper.getTokenBalance({ hash: it.token, decimals: d }, it.hash)
                it.quantity = tk.quantity
                it.quantityNumber = tk.quantityNumber
            })

            await Promise.all(map)
        }
        data.items = items

        return res.json(data)
    } catch (e) {
        logger.warn('Get list token %s holder %s error %s', hash, address, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TokenHolderController.get('/token-holders/trc21', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number'),
    check('address').optional().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('hash').optional().isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const address = (req.query.address || '').toLowerCase()
    const hash = (req.query.hash || '').toLowerCase()
    try {
        const params = {}
        if (address) {
            params.query = { token: address }
        }
        if (hash) {
            params.query = { hash: hash }
        }
        params.sort = { quantityNumber: -1 }
        params.query = Object.assign(params.query, { quantityNumber: { $gt: 0 } })
        const data = await paginate(req, 'TokenTrc21Holder', params)

        const items = data.items
        if (items.length) {
            // Get token totalSupply.
            let totalSupply = null
            let decimals
            if (address) {
                const token = await db.Token.findOne({ hash: address })
                if (token) {
                    totalSupply = token.totalSupply
                    decimals = token.decimals
                }
            }
            const length = items.length
            const baseRank = (data.currentPage - 1) * data.perPage
            for (let i = 0; i < length; i++) {
                items[i] = await TokenHolderHelper.formatHolder(items[i], totalSupply, decimals)
                items[i].rank = baseRank + i + 1
            }

            // Get tokens.
            const tokenHashes = []
            for (let i = 0; i < length; i++) {
                tokenHashes.push(items[i].token)
            }
            const tokens = await db.Token.find({ hash: { $in: tokenHashes } })
            if (tokens.length) {
                for (let i = 0; i < length; i++) {
                    for (let j = 0; j < tokens.length; j++) {
                        if (items[i].token === tokens[j].hash) {
                            tokens[j].name = tokens[j]
                                .name
                                .replace(/\u0000/g, '') // eslint-disable-line no-control-regex
                                .trim()
                            tokens[j].symbol = tokens[j]
                                .symbol
                                .replace(/\u0004/g, '') // eslint-disable-line no-control-regex
                                .trim()
                            items[i].tokenObj = tokens[j]
                        }
                    }
                }
            }
            const map = items.map(async it => {
                const d = (it.tokenObj || {}).decimals || decimals
                const tk = await TokenHelper.getTokenBalance({ hash: it.token, decimals: d }, it.hash)
                it.quantity = tk.quantity
                it.quantityNumber = tk.quantityNumber
            })
            await Promise.all(map)
        }
        data.items = items

        return res.json(data)
    } catch (e) {
        logger.warn('Get list token %s holder %s error %s', hash, address, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TokenHolderController.get('/token-holders/nft', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number'),
    check('address').optional().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('hash').optional().isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const address = (req.query.address || '').toLowerCase()
    const hash = (req.query.hash || '').toLowerCase()
    try {
        const params = {}
        if (address) {
            params.query = { token: address }
        }
        if (hash) {
            params.query = { hash: hash }
        }
        params.query = Object.assign(params.query)
        const data = await paginate(req, 'TokenNftHolder', params)

        const items = data.items
        if (items.length) {
            const length = items.length

            // Get tokens.
            const tokenHashes = []
            for (let i = 0; i < length; i++) {
                tokenHashes.push(items[i].token)
            }
            const tokens = await db.Token.find({ hash: { $in: tokenHashes } })
            if (tokens.length) {
                for (let i = 0; i < length; i++) {
                    for (let j = 0; j < tokens.length; j++) {
                        if (items[i].token === tokens[j].hash) {
                            tokens[j].name = tokens[j]
                                .name
                                .replace(/\u0000/g, '') // eslint-disable-line no-control-regex
                                .trim()
                            tokens[j].symbol = tokens[j]
                                .symbol
                                .replace(/\u0004/g, '') // eslint-disable-line no-control-regex
                                .trim()
                            items[i].tokenObj = tokens[j]
                        }
                    }
                }
            }
        }
        data.items = items

        return res.json(data)
    } catch (e) {
        logger.warn('Get list token %s holder %s error %s', hash, address, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

module.exports = TokenHolderController
