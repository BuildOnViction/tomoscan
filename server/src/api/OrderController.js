const { Router } = require('express')
const dexDb = require('../models/dex')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')
const DexHelper = require('../helpers/dex')

const OrderController = Router()

OrderController.get('/orders', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let total = await dexDb.Order.estimatedDocumentCount()
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let orders = await dexDb.Order.find({ $or: [{ status: 'OPEN' }, { status: 'PARTIAL_FILLED' }] }, {
            exchangeAddress: 1,
            baseToken: 1,
            quoteToken: 1,
            userAddress: 1,
            status: 1,
            side: 1,
            type: 1,
            quantity: 1,
            price: 1,
            filledAmount: 1,
            makeFee: 1,
            takeFee: 1,
            pairName: 1
        }).sort({ id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatOrder(orders)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list orders error %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

OrderController.get('/orders/listByDex/:slug', [
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
        let query = { exchangeAddress: hash, $or: [{ status: 'OPEN' }, { status: 'PARTIAL_FILLED' }] }
        let total = await dexDb.Order.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let orders = await dexDb.Order.find(query, {
            exchangeAddress: 1,
            baseToken: 1,
            quoteToken: 1,
            userAddress: 1,
            status: 1,
            side: 1,
            type: 1,
            quantity: 1,
            price: 1,
            filledAmount: 1,
            makeFee: 1,
            takeFee: 1,
            pairName: 1
        }).sort({ id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatOrder(orders)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list order by dex %s. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

OrderController.get('/orders/listByAccount/:slug', [
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
        let query = { userAddress: hash, $or: [{ status: 'OPEN' }, { status: 'PARTIAL_FILLED' }] }
        let total = await dexDb.Order.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let orders = await dexDb.Order.find(query, {
            exchangeAddress: 1,
            baseToken: 1,
            quoteToken: 1,
            userAddress: 1,
            status: 1,
            side: 1,
            type: 1,
            quantity: 1,
            price: 1,
            filledAmount: 1,
            makeFee: 1,
            takeFee: 1,
            pairName: 1
        }).sort({ id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatOrder(orders)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list order by user %s. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

OrderController.get('/orders/listByPair/:baseToken/:quoteToken', [
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
        let query = {
            baseToken: baseToken,
            quoteToken: quoteToken,
            $or: [{ status: 'OPEN' }, { status: 'PARTIAL_FILLED' }]
        }
        if (req.query.userAddress) {
            query.userAddress = req.query.userAddress.toLowerCase()
        }
        let total = await dexDb.Order.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let orders = await dexDb.Order.find(query, {
            exchangeAddress: 1,
            baseToken: 1,
            quoteToken: 1,
            userAddress: 1,
            status: 1,
            side: 1,
            type: 1,
            quantity: 1,
            price: 1,
            filledAmount: 1,
            makeFee: 1,
            takeFee: 1,
            pairName: 1
        }).sort({ id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatOrder(orders)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list order by pair %s-%s. Error %s', baseToken, quoteToken, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

module.exports = OrderController
