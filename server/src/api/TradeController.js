const { Router } = require('express')
const dexDb = require('../models/dex')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')
const DexHelper = require('../helpers/dex')

const TradeController = Router()

TradeController.get('/trades', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('userAddress').optional().isLength({ min: 42, max: 42 }).withMessage('User address is incorrect.'),
    check('pairName').optional(),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let query = {}
        if (req.query.user) {
            query.userAddress = req.query.user.toLowerCase()
        }
        if (req.query.pair) {
            query.pairName = req.query.pair.toUpperCase()
        }
        if (req.query.type) {
            query.type = req.query.type.toLowerCase() === 'limit' ? 'LO' : 'MO'
        }
        let total = await dexDb.Trade.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let trades = await dexDb.Trade.find(query, {
            hash: 1,
            taker: 1,
            maker: 1,
            baseToken: 1,
            quoteToken: 1,
            txHash: 1,
            pairName: 1,
            amount: 1,
            pricepoint: 1,
            status: 1
        }).sort({ id: -1 })
            .limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatTrade(trades)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list trades error %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TradeController.get('/trades/:slug', [
    check('slug').exists().isLength({ min: 66, max: 66 }).withMessage('Transaction hash is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    hash = hash.toLowerCase()
    try {
        let trade = await dexDb.Trade.findOne({}, {
            hash: 1,
            taker: 1,
            maker: 1,
            baseToken: 1,
            quoteToken: 1,
            txHash: 1,
            pairName: 1,
            amount: 1,
            pricepoint: 1,
            status: 1
        }).lean().exec()
        trade = await DexHelper.formatTrade([trade])
        return res.json(trade[0])
    } catch (e) {
        logger.warn('Get order %s detail has error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TradeController.get('/trades/listByDex/:slug', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Dex address is incorrect.'),
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    try {
        hash = hash.toLowerCase()
        let query = { exchangeAddress: hash }
        let total = await dexDb.Trade.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let trades = await dexDb.Trade.find(query, {
            hash: 1,
            taker: 1,
            maker: 1,
            baseToken: 1,
            quoteToken: 1,
            txHash: 1,
            pairName: 1,
            amount: 1,
            pricepoint: 1,
            status: 1
        }).sort({ id: -1 })
            .limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatTrade(trades)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list order by dex %s. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TradeController.get('/trades/listByAccount/:slug', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    try {
        hash = hash.toLowerCase()
        let query = { $or: [{ maker: hash }, { taker: hash }] }
        let total = await dexDb.Trade.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let trades = await dexDb.Trade.find(query, {
            hash: 1,
            taker: 1,
            maker: 1,
            baseToken: 1,
            quoteToken: 1,
            txHash: 1,
            pairName: 1,
            amount: 1,
            pricepoint: 1,
            status: 1
        }).sort({ id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatTrade(trades)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list order by user %s. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TradeController.get('/trades/listByPair/:baseToken/:quoteToken', [
    check('baseToken').exists().isLength({ min: 42, max: 42 }).withMessage('baseToken address is incorrect.'),
    check('quoteToken').exists().isLength({ min: 42, max: 42 }).withMessage('quoteToken address is incorrect.'),
    check('userAddress').optional().isLength({ min: 42, max: 42 }).withMessage('userAddress is incorrect.'),
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let baseToken = req.params.baseToken.toLowerCase()
    let quoteToken = req.params.quoteToken.toLowerCase()
    try {
        let query = { baseToken: baseToken, quoteToken: quoteToken }
        if (req.query.userAddress) {
            let userAddress = req.query.userAddress.toLowerCase()
            query['$or'] = [{ maker: userAddress }, { taker: userAddress }]
        }
        let total = await dexDb.Trade.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let trades = await dexDb.Trade.find(query, {
            hash: 1,
            taker: 1,
            maker: 1,
            baseToken: 1,
            quoteToken: 1,
            txHash: 1,
            pairName: 1,
            amount: 1,
            pricepoint: 1,
            status: 1
        }).sort({ id: -1 })
            .limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatTrade(trades)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list order by pair %s-%s. Error %s', baseToken, quoteToken, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

module.exports = TradeController
