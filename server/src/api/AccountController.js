const { Router } = require('express')
const db = require('../models')
const { paginate } = require('../helpers/utils')
const AccountHelper = require('../helpers/account')
const logger = require('../helpers/logger')
const { check, validationResult, query } = require('express-validator/check')
const accountName = require('../contracts/accountName')
const Web3Utils = require('../helpers/web3')
const request = require('request')
const config = require('config')
const { Parser } = require('json2csv')

const AccountController = Router()

AccountController.get('/accounts', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        const total = await db.Account.estimatedDocumentCount()
        const data = await paginate(req, 'Account',
            { query: { status: true }, sort: { balanceNumber: -1 } }, total)

        // Format rank.
        const items = data.items
        const baseRank = (data.currentPage - 1) * data.perPage
        for (let i = 0; i < items.length; i++) {
            items[i].rank = baseRank + i + 1
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
    const errors = validationResult(req)
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
        const web3 = await Web3Utils.getWeb3()
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
        const limit = (req.query.limit) ? parseInt(req.query.limit) : 200
        const skip = (req.query.page) ? limit * (req.query.page - 1) : 0

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
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hash = req.params.slug
    try {
        hash = hash.toLowerCase()
        const params = {}
        if (hash) {
            params.query = { signer: hash }
        }
        const acc = await db.Account.findOne({ hash: hash })
        let total = null
        if (acc) {
            total = acc.minedBlock
        }
        params.sort = { _id: -1 }
        const data = await paginate(req, 'Block', params, total)

        return res.json(data)
    } catch (e) {
        logger.warn('Cannot get list block mined of account %s. Error %s', hash, e)
        return res.status(400).send()
    }
})

AccountController.post('/accounts/:slug/download', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('token').exists().withMessage('Missing token params'),
    check('fromBlock').exists().withMessage('Missing fromBlock params'),
    check('toBlock').exists().withMessage('Missing toBlock params'),
    check('downloadType').exists().withMessage('Missing downloadType params')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const hash = req.params.slug.toLowerCase()
    const token = req.body.token
    const fromBlock = req.body.fromBlock
    const toBlock = req.body.toBlock
    const downloadType = req.body.downloadType

    const verifyToken = await new Promise((resolve, reject) => {
        request.post('https://www.google.com/recaptcha/api/siteverify', {
            formData: {
                secret: config.get('RE_CAPTCHA_SECRET'),
                response: token
            }
        }, (error, res, body) => {
            if (error) {
                return reject
            }
            return resolve(JSON.parse(body))
        })
    })

    if (verifyToken.success) {
        let data = []
        let fields = []
        if (downloadType.toUpperCase() === 'IN' || downloadType.toUpperCase() === 'OUT') {
            if (downloadType.toUpperCase() === 'IN') {
                data = await db.Tx.find({ to: hash, blockNumber: { $gte: fromBlock, $lte: toBlock } }).limit(1000)
            } else {
                data = await db.Tx.find({ from: hash, blockNumber: { $gte: fromBlock, $lte: toBlock } }).limit(1000)
            }
            fields = [
                { label: 'Hash', value: 'hash' },
                { label: 'Block Hash', value: 'blockHash' },
                { label: 'Block Number', value: 'blockNumber' },
                { label: 'From', value: 'from' },
                { label: 'To', value: 'to' },
                { label: 'Value', value: 'value' },
                { label: 'Gas', value: 'gas' },
                { label: 'Gas Price', value: 'gasPrice' },
                { label: 'Input', value: 'input' },
                { label: 'Cumulative Gas Used', value: 'cumulativeGasUsed' },
                { label: 'Gas Used', value: 'gasUsed' },
                { label: 'Status', value: 'status' },
                { label: 'Timestamp', value: 'timestamp' }
            ]
        } else if (downloadType.toUpperCase() === 'INTERNAL') {
            data = await db.InternalTx.find({ to: hash, blockNumber: { $gte: fromBlock, $lte: toBlock } }).limit(1000)
            fields = [
                { label: 'Hash', value: 'hash' },
                { label: 'From', value: 'from' },
                { label: 'To', value: 'to' },
                { label: 'Block Hash', value: 'blockHash' },
                { label: 'Block Number', value: 'blockNumber' },
                { label: 'Value', value: 'value' },
                { label: 'Timestamp', value: 'timestamp' }
            ]
        } else if (downloadType.toUpperCase() === 'REWARD') {
            const fromEpoch = Math.ceil(fromBlock / config.get('BLOCK_PER_EPOCH'))
            const toEpoch = Math.floor(toBlock / config.get('BLOCK_PER_EPOCH'))
            data = await db.Reward.find({ address: hash, epoch: { $gte: fromEpoch, $lte: toEpoch } }).limit(1000)
            fields = [
                { label: 'Epoch', value: 'epoch' },
                { label: 'Voter', value: 'address' },
                { label: 'MasterNode', value: 'validator' },
                { label: 'MasterNode Name', value: 'validatorName' },
                { label: 'Reward', value: 'reward' },
                { label: 'Reward Time', value: 'rewardTime' },
                { label: 'Sign Number', value: 'signNumber' }
            ]
        }
        const j2c = new Parser({ fields: fields })
        const csv = j2c.parse(data)
        res.attachment('data.csv')
        return res.send(csv)
    } else {
        return res.status(200).json({ errors: 'Token is incorrect' })
    }
})

module.exports = AccountController
