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
    check('txHash').optional().isLength({ min: 66, max: 66 }).withMessage('Transaction hash is incorrect.'),
    check('pairName').optional(),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        const web3 = await Web3Util.getWeb3()
        const query = {}
        if (req.query.user) {
            const user = web3.utils.toChecksumAddress(req.query.user)
            query.$or = [{ taker: user }, { maker: user }]
        }
        if (req.query.pair) {
            query.pairName = req.query.pair.toUpperCase()
        }
        if (req.query.type) {
            query.type = req.query.type.toLowerCase() === 'limit' ? 'LO' : 'MO'
        }
        if (req.query.txHash) {
            query.txHash = req.query.txHash
        }
        const total = await dexDb.Trade.countDocuments(query)
        const limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        const currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        const pages = Math.ceil(total / limit)
        const trades = await dexDb.Trade.find(query, {}).sort({ _id: -1 })
            .limit(limit).skip((currentPage - 1) * limit).lean().exec()
        const data = {
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
    const errors = validationResult(req)
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
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    const web3 = await Web3Util.getWeb3()
    try {
        hash = web3.utils.toChecksumAddress(hash)
        const query = { $or: [{ takerExchange: hash }, { makerExchange: hash }] }
        const total = await dexDb.Trade.countDocuments(query)
        const limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        const currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        const pages = Math.ceil(total / limit)
        const trades = await dexDb.Trade.find(query, {}).sort({ _id: -1 })
            .limit(limit).skip((currentPage - 1) * limit).lean().exec()
        const data = {
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
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    const web3 = await Web3Util.getWeb3()
    try {
        hash = web3.utils.toChecksumAddress(hash)
        const query = { $or: [{ maker: hash }, { taker: hash }] }
        const total = await dexDb.Trade.countDocuments(query)
        const limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        const currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        const pages = Math.ceil(total / limit)
        const trades = await dexDb.Trade.find(query, {})
            .sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        const data = {
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
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const web3 = await Web3Util.getWeb3()
    const baseToken = web3.utils.toChecksumAddress(req.params.baseToken)
    const quoteToken = web3.utils.toChecksumAddress(req.params.quoteToken)
    try {
        const query = { baseToken: baseToken, quoteToken: quoteToken }
        if (req.query.userAddress) {
            const userAddress = web3.utils.toChecksumAddress(req.query.userAddress)
            query.$or = [{ maker: userAddress }, { taker: userAddress }]
        }
        const total = await dexDb.Trade.countDocuments(query)
        const limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        const currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        const pages = Math.ceil(total / limit)
        const trades = await dexDb.Trade.find(query, {}).sort({ _id: -1 })
            .limit(limit).skip((currentPage - 1) * limit).lean().exec()
        const data = {
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
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const web3 = await Web3Util.getWeb3()
    const exchangeAddress = web3.utils.toChecksumAddress(req.params.exchangeAddress)
    const pairName = req.params.pairName.toUpperCase()
    if (req.query.date) {
        const stat = await dexDb.HistoryStatistic.findOne({
            exchangeAddress: exchangeAddress,
            pairName: pairName,
            date: new Date(req.query.date)
        })
        return res.json(stat)
    } else {
        const currentTime = new Date()
        const oneDayAgo = new Date(new Date().setDate(new Date().getDate() - 1))
        const stats = await dexDb.Statistic.find({
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

TradeController.get('/trades/dailyStats/:exchangeAddress/:pairName', [
    check('exchangeAddress').exists().isLength({ min: 42, max: 42 }).withMessage('exchange address is incorrect.'),
    check('pairName').exists().withMessage('pair is required.'),
    check('fromDate').exists().withMessage('fromDate is required.'),
    check('toDate').exists().withMessage('toDate is required.')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const web3 = await Web3Util.getWeb3()
    const exchangeAddress = web3.utils.toChecksumAddress(req.params.exchangeAddress)
    const pairName = req.params.pairName.toUpperCase()
    const fromDate = req.query.fromDate
    const toDate = req.query.toDate
    const stat = await dexDb.HistoryStatistic.find({
        exchangeAddress: exchangeAddress,
        pairName: pairName,
        date: { $gte: fromDate, $lte: toDate }
    })
    return res.json(stat)
})

TradeController.get('/trades/weeklyStats/:exchangeAddress/:pairName', [
    check('exchangeAddress').exists().isLength({ min: 42, max: 42 }).withMessage('exchange address is incorrect.'),
    check('pairName').exists().withMessage('pair is required.'),
    check('fromYear').exists().isNumeric().withMessage('fromDate is required.'),
    check('fromWeek').exists().isNumeric({ min: 1, max: 53 }).withMessage('fromDate is required.'),
    check('toYear').exists().isNumeric().withMessage('fromDate is required.'),
    check('toWeek').exists().isNumeric({ min: 1, max: 53 }).withMessage('toDate is required.')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const web3 = await Web3Util.getWeb3()
    const exchangeAddress = web3.utils.toChecksumAddress(req.params.exchangeAddress)
    const pairName = req.params.pairName.toUpperCase()
    const fromYear = req.query.fromYear
    const toYear = req.query.toYear
    const fromWeek = req.query.fromWeek
    const toWeek = req.query.toWeek
    const stat = await dexDb.WeeklyStatistic.find({
        exchangeAddress: exchangeAddress,
        pairName: pairName,
        year: { $gte: fromYear, $lte: toYear },
        week: { $gte: fromWeek, $lte: toWeek }
    })
    return res.json(stat)
})

TradeController.get('/trades/monthlyStats/:exchangeAddress/:pairName', [
    check('exchangeAddress').exists().isLength({ min: 42, max: 42 }).withMessage('exchange address is incorrect.'),
    check('pairName').exists().withMessage('pair is required.'),
    check('fromYear').exists().isNumeric().withMessage('fromDate is required.'),
    check('fromMonth').exists().isNumeric({ min: 1, max: 12 }).withMessage('fromDate is required.'),
    check('toYear').exists().isNumeric().withMessage('fromDate is required.'),
    check('toMonth').exists().isNumeric({ min: 1, max: 12 }).withMessage('toDate is required.')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const web3 = await Web3Util.getWeb3()
    const exchangeAddress = web3.utils.toChecksumAddress(req.params.exchangeAddress)
    const pairName = req.params.pairName.toUpperCase()
    const fromYear = req.query.fromYear
    const toYear = req.query.toYear
    const fromMonth = req.query.fromMonth
    const toMonth = req.query.toMonth
    const stat = await dexDb.MonthlyStatistic.find({
        exchangeAddress: exchangeAddress,
        pairName: pairName,
        year: { $gte: fromYear, $lte: toYear },
        week: { $gte: fromMonth, $lte: toMonth }
    })
    return res.json(stat)
})

module.exports = TradeController
