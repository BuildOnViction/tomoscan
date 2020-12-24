const { Router } = require('express')
const utils = require('../helpers/utils')
const db = require('../models')
const dexDb = require('../models/dex')
const TokenHelper = require('../helpers/token')
const logger = require('../helpers/logger')
const axios = require('axios')
const Web3Util = require('../helpers/web3')
const { check, validationResult, query } = require('express-validator/check')

const TokenController = Router()

TokenController.get('/tokens', [
    check('type').optional().isString().withMessage('Default is trc-20'),
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        const params = { sort: { createdAt: -1 } }
        const tokenType = req.query.type
        if (tokenType) {
            params.query = { type: tokenType }
        }
        const data = await utils.paginate(req, 'Token', params)

        for (let i = 0; i < data.items.length; i++) {
            const item = data.items[i]
            data.items[i] = await TokenHelper.formatToken(item)
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list tokens error %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})
TokenController.get('/tokens/search', [
    query('query').isAlphanumeric().withMessage('query must be alpha numeric'),
    query('limit').isInt({ min: 0, max: 50 }).withMessage('limit must be number and less than 200 items per page'),
    query('page').isInt({ min: 0 }).withMessage('page must be number'),
    query('type').isAlphanumeric().withMessage('type must be alpha numeric')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        const query = req.query.query || ''
        const type = req.query.type || ''
        const limit = (req.query.limit) ? parseInt(req.query.limit) : 200
        const skip = (req.query.page) ? limit * (req.query.page - 1) : 0
        const total = db.Token.count({
            name: { $regex: query, $options: 'i' },
            type: type
        })
        const data = await db.Token.find({
            name: { $regex: query, $options: 'i' },
            type: type
        }).limit(limit).skip(skip).lean().exec()

        return res.json({
            total: await total,
            items: data
        })
    } catch (e) {
        logger.warn('Search tokens error %s', e)
        return res.status(400).json({ errors: { message: 'Something error!' } })
    }
})

TokenController.get('/tokens/:slug', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const hash = req.params.slug.toLowerCase()
    try {
        let token = await db.Token.findOne({ hash: hash }).lean()
        if (!token) {
            return res.status(404).json({ errors: { message: 'Token was not found' } })
        }

        token = await TokenHelper.formatToken(token)
        const blacklistUrl = 'https://raw.githubusercontent.com/tomochain/tokens/master/blacklist.json'
        const blacklist = await axios.get(blacklistUrl)
        if (blacklist.data.includes(hash)) {
            token.isPhising = true
        } else {
            token.isPhising = false
        }
        const verifiedUrl = 'https://raw.githubusercontent.com/tomochain/tokens/master/verifiedlist.json'
        const verifiedList = await axios.get(verifiedUrl)
        if (verifiedList.data.includes(hash)) {
            token.isVerified = true
        } else {
            token.isVerified = false
        }
        const coinList = ['0xae44807d8a9ce4b30146437474ed6faaafa1b809', '0x2eaa73bd0db20c64f53febea7b5f5e5bccc7fb8b']
        if (!coinList.includes(hash)) {
            const bridgeUrl = 'https://raw.githubusercontent.com/tomochain/tokens/master/bridge.json'
            const bridgeList = await axios.get(bridgeUrl)
            if (bridgeList.data.includes(hash)) {
                token.isWrappedToken = true
            } else {
                token.isWrappedToken = false
            }
        } else {
            token.isWrappedToken = false
        }

        try {
            const moreInfoUrl = `https://raw.githubusercontent.com/tomochain/tokens/master/tokens/${hash}.json`
            const moreInfo = await axios.get(moreInfoUrl)
            token.moreInfo = moreInfo.data
        } catch (e) {
            logger.warn('Token is not verify')
        }

        res.json(token)
    } catch (e) {
        logger.warn('Get token %s detail error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TokenController.get('/tokens/holding/:tokenType/:holder', [
    check('tokenType').exists().isString().withMessage('trc20/trc21/trc721'),
    check('holder').exists().isLength({ min: 42, max: 42 }).withMessage('Address holding token'),
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const tokenType = req.params.tokenType.toLowerCase()
    const holder = req.params.holder.toLowerCase()

    try {
        let data
        if (tokenType === 'trc20') {
            data = await utils.paginate(req, 'TokenHolder', { query: { hash: holder } })
        } else if (tokenType === 'trc21') {
            const dexToken = await dexDb.Token.distinct('contractAddress')
            const listToken = []
            for (let i = 0; i < dexToken.length; i++) {
                const t = dexToken[i].toLowerCase()
                if (t !== '0x0000000000000000000000000000000000000001') {
                    listToken.push(t)
                }
            }
            const tomoxToken = await db.Token.find({ hash: { $in: listToken } })
            const holderExist = await db.TokenTrc21Holder.find({ hash: holder, token: { $in: listToken } },
                { token: 1 })
            const exist = []
            for (let i = 0; i < holderExist.length; i++) {
                exist.push(holderExist[i].token)
            }
            const notExist = []
            for (let i = 0; i < tomoxToken.length; i++) {
                if (!exist.includes(tomoxToken[i].hash)) {
                    notExist.push({
                        hash: holder,
                        token: tomoxToken[i].hash,
                        tokenDecimals: tomoxToken[i].decimals,
                        quantity: '0',
                        quantityNumber: 0
                    })
                }
            }
            if (notExist.length > 0) {
                await db.TokenTrc21Holder.insertMany(notExist)
            }
            data = await utils.paginate(req, 'TokenTrc21Holder', { query: { hash: holder } })
        } else if (tokenType === 'trc721') {
            data = await utils.paginate(req, 'TokenNftHolder', { query: { holder: holder } })
        } else {
            data = { total: 0, perPage: 20, currentPage: 1, pages: 0, items: [] }
        }

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

                            if (tokenType === 'trc20' || tokenType === 'trc21') {
                                const tk = await TokenHelper.getTokenBalance(
                                    { hash: tokens[j].hash, decimals: tokens[j].decimals }, items[i].hash)
                                items[i].quantity = tk.quantity
                                items[i].quantityNumber = tk.quantityNumber
                            }
                        }
                    }
                }
            }
        }
        data.items = items

        return res.json(data)
    } catch (e) {
        logger.warn('Get list token holding: holder %s token type %s. Error %s', holder, tokenType, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

TokenController.get('/tokens/:token/holder/:holder', [
    check('token').exists().isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.'),
    check('holder').exists().isLength({ min: 42, max: 42 }).withMessage('Holder address is incorrect.')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        const token = req.params.token.toLowerCase().trim()
        const holder = req.params.holder.toLowerCase().trim()

        // const t = await db.Token.findOne({ hash: token }).lean()
        // if (!t) {
        //     return res.status(404).json({ errors: { message: 'Token was not found' } })
        // }

        let tokenHolder = await db.TokenHolder.findOne({ hash: holder, token: token })
        let exist = true
        if (!tokenHolder) {
            tokenHolder = await db.TokenTrc21Holder.findOne({ hash: holder, token: token })
            if (!tokenHolder) {
                tokenHolder = {
                    hash: holder,
                    token: token,
                    quantity: '0',
                    quantityNumber: 0
                }
                exist = false
            }
        }

        // Get token balance by read smart contract
        let tk = await db.Token.findOne({ hash: token })
        if (!tk) {
            const web3 = await Web3Util.getWeb3()
            const tokenFuncs = await TokenHelper.getTokenFuncs()
            let decimals = await web3.eth.call({ to: token, data: tokenFuncs.decimals })
            decimals = await web3.utils.hexToNumberString(decimals)
            tk = { hash: token, decimals: decimals }
        }
        const balance = await TokenHelper.getTokenBalance(tk, holder)

        tokenHolder.quantity = balance.quantity
        tokenHolder.quantityNumber = balance.quantityNumber
        if (exist) {
            await tokenHolder.save()
        } else {
            if (tk && tk.type === 'trc20') {
                await db.TokenHolder.insertMany([tokenHolder])
            } else if (tk && tk.type === 'trc21') {
                await db.TokenTrc21Holder.insertMany([tokenHolder])
            }
        }
        res.json(tokenHolder)
    } catch (e) {
        logger.warn('Get token holder error %s', e)
        return res.status(400).json({ errors: { message: 'Something error!' } })
    }
})

TokenController.get('/tokens/:token/nftHolder/:holder', [
    check('token').exists().isLength({ min: 42, max: 42 }).withMessage('Token address is incorrect.'),
    check('holder').exists().isLength({ min: 42, max: 42 }).withMessage('Holder address is incorrect.'),
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        const token = req.params.token.toLowerCase()
        const holder = req.params.holder.toLowerCase()
        const data = await utils.paginate(req, 'TokenNftHolder', { query: { holder: holder, token: token } })

        res.json(data)
    } catch (e) {
        logger.warn('Get nft token holder error %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

module.exports = TokenController
