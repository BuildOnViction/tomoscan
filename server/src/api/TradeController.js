const { Router } = require('express')
const dexDb = require('../models/dex')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')
const DexHelper = require('../helpers/dex')
const Web3Util = require('../helpers/web3')

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
        let web3 = await Web3Util.getWeb3()
        let query = {}
        if (req.query.user) {
            query.userAddress = web3.utils.toChecksumAddress(req.query.user)
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
        let trades = await dexDb.Trade.find(query, {}).sort({ _id: -1 })
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
        let trade = await dexDb.Trade.findOne({ hash: hash }).lean().exec()
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
    let web3 = await Web3Util.getWeb3()
    try {
        hash = web3.utils.toChecksumAddress(hash)
        let query = { $or: [{ takerExchange: hash }, { makerExchange: hash }] }
        let total = await dexDb.Trade.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let trades = await dexDb.Trade.find(query, {}).sort({ _id: -1 })
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
    let web3 = await Web3Util.getWeb3()
    try {
        hash = web3.utils.toChecksumAddress(hash)
        let query = { $or: [{ maker: hash }, { taker: hash }] }
        let total = await dexDb.Trade.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let trades = await dexDb.Trade.find(query, {})
            .sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
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
    let web3 = await Web3Util.getWeb3()
    let baseToken = web3.utils.toChecksumAddress(req.params.baseToken)
    let quoteToken = web3.utils.toChecksumAddress(req.params.quoteToken)
    try {
        let query = { baseToken: baseToken, quoteToken: quoteToken }
        if (req.query.userAddress) {
            let userAddress = web3.utils.toChecksumAddress(req.query.userAddress)
            query['$or'] = [{ maker: userAddress }, { taker: userAddress }]
        }
        let total = await dexDb.Trade.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let trades = await dexDb.Trade.find(query, {}).sort({ _id: -1 })
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

TradeController.get('/trades/stats/:exchangeAddress/:pairName', [
    check('exchangeAddress').exists().isLength({ min: 42, max: 42 }).withMessage('exchange address is incorrect.'),
    check('pairName').exists().withMessage('pair is required.'),
    check('date').optional().withMessage('if does not have, will calculate current')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let web3 = await Web3Util.getWeb3()
    let exchangeAddress = web3.utils.toChecksumAddress(req.params.exchangeAddress)
    let pairName = req.params.pairName.toUpperCase()
    if (req.query.date) {
        let stat = await dexDb.HistoryStatistic.findOne({
            exchangeAddress: exchangeAddress,
            pairName: pairName,
            date: new Date(req.query.date)
        })
        return res.json(stat)
    } else {
        let currentTime = new Date()
        let oneDayAgo = new Date(new Date().setDate(new Date().getDate() - 1))
        let stats = await dexDb.Statistic.find({
            exchangeAddress: exchangeAddress,
            pairName: pairName,
            date: { $gte: oneDayAgo, $lte: currentTime }
        })
        let volume24h = 0
        let tradeNumber = 0
        let totalFee = 0
        for (let i = 0; i < stats.length; i++) {
            volume24h += stats[i].volume
            tradeNumber += stats[i].tradeNumber
            totalFee += stats[i].totalFee
        }
        return res.json({ volume24h: volume24h, tradeNumber: tradeNumber, totalFee: totalFee })
    }
})

module.exports = TradeController
