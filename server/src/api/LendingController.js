const { Router } = require('express')
const dexDb = require('../models/dex')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')
const DexHelper = require('../helpers/dex')
const Web3Util = require('../helpers/web3')

const LendingController = Router()

LendingController.get('/lending/orders', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('userAddress').optional().isLength({ min: 42, max: 42 }).withMessage('User address is incorrect.'),
    check('lendingToken').optional().isLength({ min: 42, max: 42 }).withMessage('lendingToken address is incorrect.'),
    check('collateralToken').optional().isLength({ min: 42, max: 42 })
        .withMessage('collateralToken address is incorrect.'),
    check('relayer').optional().isLength({ min: 42, max: 42 }).withMessage('relayer address is incorrect.'),
    check('side').optional(),
    check('status').optional(),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let web3 = await Web3Util.getWeb3()
    try {
        let query = {}
        if (req.query.user) {
            if (web3.utils.isAddress(req.query.user)) {
                query.userAddress = web3.utils.toChecksumAddress(req.query.user)
            } else {
                query.userAddress = req.query.user
            }
        }
        if (req.query.lendingToken) {
            if (web3.utils.isAddress(req.query.lendingToken)) {
                query.lendingToken = web3.utils.toChecksumAddress(req.query.lendingToken)
            } else {
                query.lendingToken = req.query.lendingToken
            }
        }
        if (req.query.collateralToken) {
            if (web3.utils.isAddress(req.query.collateralToken)) {
                query.collateralToken = web3.utils.toChecksumAddress(req.query.collateralToken)
            } else {
                query.collateralToken = req.query.collateralToken
            }
        }
        if (req.query.relayer) {
            if (web3.utils.isAddress(req.query.relayer)) {
                query.relayer = web3.utils.toChecksumAddress(req.query.relayer)
            } else {
                query.relayer = req.query.relayer
            }
        }
        if (req.query.side) {
            query.side = req.query.side.toUpperCase()
        }
        if (req.query.status) {
            query.type = req.query.status.toUpperCase()
        }
        let total = await dexDb.LendingItem.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let orders = await dexDb.LendingItem.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatLendingOrder(orders)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list orders error %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/orders/:slug', [
    check('slug').exists().isLength({ min: 66, max: 66 }).withMessage('Lending order hash is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    hash = hash.toLowerCase()
    try {
        let order = await dexDb.LendingItem.findOne({ hash: hash }, {
            signature: 0,
            key: 0
        }).lean().exec()
        order = await DexHelper.formatLendingOrder([order])
        return res.json(order[0])
    } catch (e) {
        logger.warn('Get order %s detail has error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/orders/listByDex/:slug', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Dex address is incorrect.'),
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let web3 = await Web3Util.getWeb3()
    let hash = req.params.slug
    try {
        hash = web3.utils.toChecksumAddress(hash)
        let query = { relayer: hash }
        let total = await dexDb.LendingItem.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let orders = await dexDb.LendingItem.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatLendingOrder(orders)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list order by dex %s. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/orders/listByAccount/:slug', [
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
        let query = { userAddress: hash }
        let total = await dexDb.LendingItem.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let orders = await dexDb.LendingItem.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatLendingOrder(orders)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list order by user %s. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/trades', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('userAddress').optional().isLength({ min: 42, max: 42 }).withMessage('User address is incorrect.'),
    check('lendingToken').optional().isLength({ min: 42, max: 42 }).withMessage('lendingToken address is incorrect.'),
    check('collateralToken').optional().isLength({ min: 42, max: 42 })
        .withMessage('collateralToken address is incorrect.'),
    check('relayer').optional().isLength({ min: 42, max: 42 }).withMessage('relayer address is incorrect.'),
    check('side').optional(),
    check('status').optional(),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let web3 = await Web3Util.getWeb3()
    try {
        let query = {}
        if (req.query.user) {
            if (web3.utils.isAddress(req.query.user)) {
                let user = web3.utils.toChecksumAddress(req.query.user)
                query['$or'] = [
                    { investor: user }, { borrower: user }
                ]
            } else {
                query['$or'] = [
                    { investor: req.query.user }, { borrower: req.query.user }
                ]
            }
        }
        if (req.query.lendingToken) {
            if (web3.utils.isAddress(req.query.lendingToken)) {
                query.lendingToken = web3.utils.toChecksumAddress(req.query.lendingToken)
            } else {
                query.lendingToken = req.query.lendingToken
            }
        }
        if (req.query.collateralToken) {
            if (web3.utils.isAddress(req.query.collateralToken)) {
                query.collateralToken = web3.utils.toChecksumAddress(req.query.collateralToken)
            } else {
                query.collateralToken = req.query.collateralToken
            }
        }
        if (req.query.side) {
            query.side = req.query.side.toUpperCase()
        }
        if (req.query.status) {
            query.type = req.query.status.toUpperCase()
        }
        let total = await dexDb.LendingTrade.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let trades = await dexDb.LendingTrade.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatLendingTrade(trades)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list orders error %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/trades/:slug', [
    check('slug').exists().isLength({ min: 66, max: 66 }).withMessage('Lending order hash is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    hash = hash.toLowerCase()
    try {
        let trade = await dexDb.LendingTrade.findOne({ hash: hash }, {
            signature: 0,
            key: 0
        }).lean().exec()
        trade = await DexHelper.formatLendingTrade([trade])
        return res.json(trade[0])
    } catch (e) {
        logger.warn('Get order %s detail has error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/trades/listByDex/:slug', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Dex address is incorrect.'),
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let web3 = await Web3Util.getWeb3()
    let hash = req.params.slug
    try {
        hash = web3.utils.toChecksumAddress(hash)
        let query = { $or: [ { borrowingRelayer: hash }, { investingRelayer: hash } ] }
        let total = await dexDb.LendingTrade.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let trades = await dexDb.LendingTrade.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatLendingTrade(trades)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list order by dex %s. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/trades/listByAccount/:slug', [
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
        let query = { $or: [ { borrower: hash }, { investor: hash } ] }
        let total = await dexDb.LendingTrade.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let trades = await dexDb.LendingTrade.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatLendingTrade(trades)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list order by user %s. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/topup', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('userAddress').optional().isLength({ min: 42, max: 42 }).withMessage('User address is incorrect.'),
    check('lendingToken').optional().isLength({ min: 42, max: 42 }).withMessage('lendingToken address is incorrect.'),
    check('collateralToken').optional().isLength({ min: 42, max: 42 })
        .withMessage('collateralToken address is incorrect.'),
    check('relayer').optional().isLength({ min: 42, max: 42 }).withMessage('relayer address is incorrect.'),
    check('side').optional(),
    check('status').optional(),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let web3 = await Web3Util.getWeb3()
    try {
        let query = {}
        if (req.query.user) {
            if (web3.utils.isAddress(req.query.user)) {
                query.userAddress = web3.utils.toChecksumAddress(req.query.user)
            } else {
                query.userAddress = req.query.user
            }
        }
        if (req.query.lendingToken) {
            if (web3.utils.isAddress(req.query.lendingToken)) {
                query.lendingToken = web3.utils.toChecksumAddress(req.query.lendingToken)
            } else {
                query.lendingToken = req.query.lendingToken
            }
        }
        if (req.query.collateralToken) {
            if (web3.utils.isAddress(req.query.collateralToken)) {
                query.collateralToken = web3.utils.toChecksumAddress(req.query.collateralToken)
            } else {
                query.collateralToken = req.query.collateralToken
            }
        }
        if (req.query.relayer) {
            if (web3.utils.isAddress(req.query.relayer)) {
                query.relayer = web3.utils.toChecksumAddress(req.query.relayer)
            } else {
                query.relayer = req.query.relayer
            }
        }
        if (req.query.side) {
            query.side = req.query.side.toUpperCase()
        }
        if (req.query.status) {
            query.type = req.query.status.toUpperCase()
        }
        let total = await dexDb.LendingTopup.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let orders = await dexDb.LendingTopup.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatLendingOrder(orders)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list orders error %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/topup/:slug', [
    check('slug').exists().isLength({ min: 66, max: 66 }).withMessage('Lending order hash is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    hash = hash.toLowerCase()
    try {
        let order = await dexDb.LendingTopup.findOne({ hash: hash }, {
            signature: 0,
            key: 0
        }).lean().exec()
        order = await DexHelper.formatLendingOrder([order])
        return res.json(order[0])
    } catch (e) {
        logger.warn('Get order %s detail has error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/topup/listByDex/:slug', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Dex address is incorrect.'),
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let web3 = await Web3Util.getWeb3()
    let hash = req.params.slug
    try {
        hash = web3.utils.toChecksumAddress(hash)
        let query = { relayer: hash }
        let total = await dexDb.LendingTopup.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let orders = await dexDb.LendingTopup.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatLendingOrder(orders)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list order by dex %s. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/topup/listByAccount/:slug', [
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
        let query = { userAddress: hash }
        let total = await dexDb.LendingTopup.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let orders = await dexDb.LendingTopup.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatLendingOrder(orders)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list order by user %s. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/repay', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('userAddress').optional().isLength({ min: 42, max: 42 }).withMessage('User address is incorrect.'),
    check('lendingToken').optional().isLength({ min: 42, max: 42 }).withMessage('lendingToken address is incorrect.'),
    check('collateralToken').optional().isLength({ min: 42, max: 42 })
        .withMessage('collateralToken address is incorrect.'),
    check('relayer').optional().isLength({ min: 42, max: 42 }).withMessage('relayer address is incorrect.'),
    check('side').optional(),
    check('status').optional(),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let web3 = await Web3Util.getWeb3()
    try {
        let query = {}
        if (req.query.user) {
            if (web3.utils.isAddress(req.query.user)) {
                query.userAddress = web3.utils.toChecksumAddress(req.query.user)
            } else {
                query.userAddress = req.query.user
            }
        }
        if (req.query.lendingToken) {
            if (web3.utils.isAddress(req.query.lendingToken)) {
                query.lendingToken = web3.utils.toChecksumAddress(req.query.lendingToken)
            } else {
                query.lendingToken = req.query.lendingToken
            }
        }
        if (req.query.collateralToken) {
            if (web3.utils.isAddress(req.query.collateralToken)) {
                query.collateralToken = web3.utils.toChecksumAddress(req.query.collateralToken)
            } else {
                query.collateralToken = req.query.collateralToken
            }
        }
        if (req.query.relayer) {
            if (web3.utils.isAddress(req.query.relayer)) {
                query.relayer = web3.utils.toChecksumAddress(req.query.relayer)
            } else {
                query.relayer = req.query.relayer
            }
        }
        if (req.query.side) {
            query.side = req.query.side.toUpperCase()
        }
        if (req.query.status) {
            query.type = req.query.status.toUpperCase()
        }
        let total = await dexDb.LendingTopup.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let orders = await dexDb.LendingTopup.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatLendingOrder(orders)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list orders error %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/repay/:slug', [
    check('slug').exists().isLength({ min: 66, max: 66 }).withMessage('Lending order hash is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    hash = hash.toLowerCase()
    try {
        let order = await dexDb.LendingTopup.findOne({ hash: hash }, {
            signature: 0,
            key: 0
        }).lean().exec()
        order = await DexHelper.formatLendingOrder([order])
        return res.json(order[0])
    } catch (e) {
        logger.warn('Get order %s detail has error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/repay/listByDex/:slug', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Dex address is incorrect.'),
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let web3 = await Web3Util.getWeb3()
    let hash = req.params.slug
    try {
        hash = web3.utils.toChecksumAddress(hash)
        let query = { relayer: hash }
        let total = await dexDb.LendingTopup.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let orders = await dexDb.LendingTopup.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatLendingOrder(orders)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list order by dex %s. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

LendingController.get('/lending/repay/listByAccount/:slug', [
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
        let query = { userAddress: hash }
        let total = await dexDb.LendingTopup.countDocuments(query)
        let limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        let currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let pages = Math.ceil(total / limit)
        let orders = await dexDb.LendingTopup.find(query, {
            signature: 0,
            key: 0
        }).sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        let data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: await DexHelper.formatLendingOrder(orders)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list order by user %s. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

module.exports = LendingController
