const { Router } = require('express')
const db = require('../models')
const { paginate } = require('../helpers/utils')
const AccountHelper = require('../helpers/account')
const logger = require('../helpers/logger')
const { check, validationResult, query } = require('express-validator/check')
const accountName = require('../contracts/accountName')
const Web3Utils = require('../helpers/web3')

const AccountController = Router()

AccountController.get('/accounts', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let total = await db.Account.estimatedDocumentCount()
        let data = await paginate(req, 'Account',
            { query: { status: true }, sort: { balanceNumber: -1 } }, total)

        // Format rank.
        let items = data.items
        let baseRank = (data.currentPage - 1) * data.perPage
        for (let i = 0; i < items.length; i++) {
            items[i]['rank'] = baseRank + i + 1
        }
        data.items = items
        if (data.pages > 500) {
            data.pages = 500
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list account error %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

AccountController.get('/accounts/:slug', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    try {
        hash = hash.toLowerCase()
        let account
        try {
            account = await AccountHelper.getAccountDetail(hash)
        } catch (e) {
            logger.warn('Cannot find account %s. Error %s', hash, e)
            return res.status(404).json({ errors: { message: 'Account is not found!' } })
        }
        account = await AccountHelper.formatAccount(account)
        account.accountName = accountName[account.hash] || null
        let web3 = await Web3Utils.getWeb3()
        account.hash = web3.utils.toChecksumAddress(hash)
        return res.json(account)
    } catch (e) {
        logger.warn('Cannot find account detail %s. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

AccountController.get('/accounts/:slug/listTokens', [
    query('limit')
        .isInt({ min: 0, max: 200 }).optional().withMessage('limit should greater than 0 and less than 200'),
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500'),
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.')
], async (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return next(errors.array())
    }
    try {
        const creator = (req.params.slug || '').toLowerCase()
        let limit = (req.query.limit) ? parseInt(req.query.limit) : 200
        let skip
        skip = (req.query.page) ? limit * (req.query.page - 1) : 0

        const total = db.Account.count({
            isToken: true,
            contractCreation: creator
        })
        const tokens = await db.Account.find({
            isToken: true,
            contractCreation: creator
        }).sort({ createdAt: -1 }).limit(limit).skip(skip).lean().exec()
        const map = await Promise.all(tokens.map(async (t) => {
            const tokenDetail = await db.Token.findOne({
                hash: t.hash
            })
            const holders = await db.TokenTrc21Holder.count({
                token: t.hash,
                hash: { $ne: '0x0000000000000000000000000000000000000000' }
            })
            if (tokenDetail) {
                Object.assign(t, tokenDetail._doc)
            }
            if (holders) {
                t.holders = holders
            }
            return t
        }))
        return res.json({
            total: await total,
            items: map
        })
    } catch (error) {
        return next(error)
    }
})

AccountController.get('/accounts/:slug/mined', [
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
        let params = {}
        if (hash) {
            params.query = { signer: hash }
        }
        let acc = await db.Account.findOne({ hash: hash })
        let total = null
        if (acc) {
            total = acc.minedBlock
        }
        params.sort = { _id: -1 }
        let data = await paginate(req, 'Block', params, total)

        return res.json(data)
    } catch (e) {
        logger.warn('Cannot get list block mined of account %s. Error %s', hash, e)
        return res.status(400).send()
    }
})

module.exports = AccountController
