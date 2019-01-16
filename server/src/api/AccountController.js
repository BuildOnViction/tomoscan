import { Router } from 'express'
import db from '../models'
import { paginate } from '../helpers/utils'
import AccountHelper from '../helpers/account'
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')

const AccountController = Router()

AccountController.get('/accounts', [
    check('limit').isInt({ lt: 30 }).withMessage('Limit is less than 30 items per page'),
    check('page').isInt().withMessage('Require page is number')
], async (req, res, next) => {
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

        return res.json(account)
    } catch (e) {
        logger.warn('Cannot find account detail %s. Error %s', hash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

AccountController.get('/accounts/:slug/mined', [
    check('slug').exists().isLength({ min: 42, max: 42 }).withMessage('Account address is incorrect.'),
    check('limit').isInt({ lt: 30 }).withMessage('Limit is less than 30 items per page'),
    check('page').isInt().withMessage('Require page is number')
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
        let acc = await db.SpecialAccount.findOne({ hash: hash })
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

export default AccountController
