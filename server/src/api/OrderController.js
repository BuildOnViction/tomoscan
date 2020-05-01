const { Router } = require('express')
const dexDb = require('../models/dex')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')
const DexHelper = require('../helpers/dex')
const Web3Util = require('../helpers/web3')

const OrderController = Router()

OrderController.get('/orders', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('userAddress').optional().isLength({ min: 42, max: 42 }).withMessage('User address is incorrect.'),
    check('baseToken').optional().isLength({ min: 42, max: 42 }).withMessage('base token address is incorrect.'),
    check('quoteToken').optional().isLength({ min: 42, max: 42 }).withMessage('quote token address is incorrect.'),
    check('txHash').optional().isLength({ min: 66, max: 66 }).withMessage('Transaction hash is incorrect.'),
    check('side').optional(),
    check('status').optional(),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const web3 = await Web3Util.getWeb3()
    try {
        const query = {}
        if (req.query.user) {
            if (web3.utils.isAddress(req.query.user)) {
                query.userAddress = web3.utils.toChecksumAddress(req.query.user)
            } else {
                query.userAddress = req.query.user
            }
        }
        if (req.query.baseToken) {
            if (web3.utils.isAddress(req.query.baseToken)) {
                query.baseToken = web3.utils.toChecksumAddress(req.query.baseToken)
            } else {
                query.baseToken = req.query.baseToken
            }
        }
        if (req.query.quoteToken) {
            if (web3.utils.isAddress(req.query.quoteToken)) {
                query.quoteToken = web3.utils.toChecksumAddress(req.query.quoteToken)
            } else {
                query.quoteToken = req.query.quoteToken
            }
        }
        if (req.query.side) {
            query.side = req.query.side.toUpperCase()
        }
        if (req.query.status) {
            query.type = req.query.status.toUpperCase()
        }
        if (req.query.txHash) {
            query.txHash = req.query.txHash
        }
        const total = await dexDb.Order.countDocuments(query)
        const limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        const currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        const pages = Math.ceil(total / limit)
        const orders = await dexDb.Order.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        const data = {
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

OrderController.get('/orders/:slug', [
    check('slug').exists().isLength({ min: 66, max: 66 }).withMessage('Transaction hash is incorrect.')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    hash = hash.toLowerCase()
    try {
        let order = await dexDb.Order.findOne({ hash: hash }, {
            signature: 0,
            key: 0
        }).lean().exec()
        order = await DexHelper.formatOrder([order])
        return res.json(order[0])
    } catch (e) {
        logger.warn('Get order %s detail has error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

OrderController.get('/orders/listByDex/:slug', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Dex address is incorrect.'),
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const web3 = await Web3Util.getWeb3()
    let hash = req.params.slug
    try {
        hash = web3.utils.toChecksumAddress(hash)
        const query = { exchangeAddress: hash, $or: [{ status: 'OPEN' }, { status: 'PARTIAL_FILLED' }] }
        const total = await dexDb.Order.countDocuments(query)
        const limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        const currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        const pages = Math.ceil(total / limit)
        const orders = await dexDb.Order.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        const data = {
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
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    const web3 = await Web3Util.getWeb3()
    try {
        hash = web3.utils.toChecksumAddress(hash)
        const query = { userAddress: hash, $or: [{ status: 'OPEN' }, { status: 'PARTIAL_FILLED' }] }
        const total = await dexDb.Order.countDocuments(query)
        const limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        const currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        const pages = Math.ceil(total / limit)
        const orders = await dexDb.Order.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        const data = {
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
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const web3 = await Web3Util.getWeb3()
    const baseToken = web3.utils.toChecksumAddress(req.params.baseToken)
    const quoteToken = web3.utils.toChecksumAddress(req.params.quoteToken)
    try {
        const query = {
            baseToken: baseToken,
            quoteToken: quoteToken,
            $or: [{ status: 'OPEN' }, { status: 'PARTIAL_FILLED' }]
        }
        if (req.query.userAddress) {
            query.userAddress = web3.utils.toChecksumAddress(req.query.userAddress)
        }
        const total = await dexDb.Order.countDocuments(query)
        const limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        const currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        const pages = Math.ceil(total / limit)
        const orders = await dexDb.Order.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        const data = {
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
