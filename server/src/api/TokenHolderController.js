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
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let address = (req.query.address || '').toLowerCase()
    let hash = (req.query.hash || '').toLowerCase()
    try {
        let params = {}
        if (address) {
            params.query = { token: address }
        }
        if (hash) {
            params.query = { hash: hash }
        }
        params.sort = { quantityNumber: -1 }
        params.query = Object.assign(params.query, { quantityNumber: { $gt: 0 } })
        let data = await paginate(req, 'TokenHolder', params)

        let items = data.items
        if (items.length) {
            // Get token totalSupply.
            let totalSupply = null
            let decimals
            if (address) {
                let token = await db.Token.findOne({ hash: address })
                if (token) {
                    totalSupply = token.totalSupply
                    decimals = token.decimals
                }
            }
            let length = items.length
            let baseRank = (data.currentPage - 1) * data.perPage
            for (let i = 0; i < length; i++) {
                items[i] = await TokenHolderHelper.formatHolder(items[i], totalSupply, decimals)
                items[i]['rank'] = baseRank + i + 1
            }

            // Get tokens.
            let tokenHashes = []
            for (let i = 0; i < length; i++) {
                tokenHashes.push(items[i]['token'])
            }
            let tokens = await db.Token.find({ hash: { $in: tokenHashes } })
            if (tokens.length) {
                for (let i = 0; i < length; i++) {
                    for (let j = 0; j < tokens.length; j++) {
                        if (items[i]['token'] === tokens[j]['hash']) {
                            tokens[j].name = tokens[j]
                                .name
                                .replace(/\u0000/g, '') // eslint-disable-line no-control-regex
                                .trim()
                            tokens[j].symbol = tokens[j]
                                .symbol
                                .replace(/\u0004/g, '') // eslint-disable-line no-control-regex
                                .trim()
                            items[i]['tokenObj'] = tokens[j]
                        }
                    }
                }
            }

            let map = items.map(async it => {
                let d = (it['tokenObj'] || {}).decimals || decimals
                let tk = await TokenHelper.getTokenBalance({ hash: it.token, decimals: d }, it.hash)
                it.quantity = tk.quantity
                it.quantityNumber = tk.quantityNumber
                return it
            })

            items = await Promise.all(map)
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
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let address = (req.query.address || '').toLowerCase()
    let hash = (req.query.hash || '').toLowerCase()
    try {
        let params = {}
        if (address) {
            params.query = { token: address }
        }
        if (hash) {
            params.query = { hash: hash }
        }
        params.sort = { quantityNumber: -1 }
        params.query = Object.assign(params.query, { quantityNumber: { $gt: 0 } })
        let data = await paginate(req, 'TokenTrc21Holder', params)

        let items = data.items
        if (items.length) {
            // Get token totalSupply.
            let totalSupply = null
            let decimals
            if (address) {
                let token = await db.Token.findOne({ hash: address })
                if (token) {
                    totalSupply = token.totalSupply
                    decimals = token.decimals
                }
            }
            let length = items.length
            let baseRank = (data.currentPage - 1) * data.perPage
            for (let i = 0; i < length; i++) {
                items[i] = await TokenHolderHelper.formatHolder(items[i], totalSupply, decimals)
                items[i]['rank'] = baseRank + i + 1
            }

            // Get tokens.
            let tokenHashes = []
            for (let i = 0; i < length; i++) {
                tokenHashes.push(items[i]['token'])
            }
            let tokens = await db.Token.find({ hash: { $in: tokenHashes } })
            if (tokens.length) {
                for (let i = 0; i < length; i++) {
                    for (let j = 0; j < tokens.length; j++) {
                        if (items[i]['token'] === tokens[j]['hash']) {
                            tokens[j].name = tokens[j]
                                .name
                                .replace(/\u0000/g, '') // eslint-disable-line no-control-regex
                                .trim()
                            tokens[j].symbol = tokens[j]
                                .symbol
                                .replace(/\u0004/g, '') // eslint-disable-line no-control-regex
                                .trim()
                            items[i]['tokenObj'] = tokens[j]
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

TokenHolderController.get('/token-holders/nft', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number'),
    check('address').optional().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('hash').optional().isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let address = (req.query.address || '').toLowerCase()
    let hash = (req.query.hash || '').toLowerCase()
    try {
        let params = {}
        if (address) {
            params.query = { token: address }
        }
        if (hash) {
            params.query = { hash: hash }
        }
        params.query = Object.assign(params.query)
        let data = await paginate(req, 'TokenNftHolder', params)

        let items = data.items
        if (items.length) {
            let length = items.length

            // Get tokens.
            let tokenHashes = []
            for (let i = 0; i < length; i++) {
                tokenHashes.push(items[i]['token'])
            }
            let tokens = await db.Token.find({ hash: { $in: tokenHashes } })
            if (tokens.length) {
                for (let i = 0; i < length; i++) {
                    for (let j = 0; j < tokens.length; j++) {
                        if (items[i]['token'] === tokens[j]['hash']) {
                            tokens[j].name = tokens[j]
                                .name
                                .replace(/\u0000/g, '') // eslint-disable-line no-control-regex
                                .trim()
                            tokens[j].symbol = tokens[j]
                                .symbol
                                .replace(/\u0004/g, '') // eslint-disable-line no-control-regex
                                .trim()
                            items[i]['tokenObj'] = tokens[j]
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
