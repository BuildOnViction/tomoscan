import { Router } from 'express'
import db from '../models'
import { paginate } from '../helpers/utils'
import AccountHelper from '../helpers/account'
const logger = require('../helpers/logger')

const AccountController = Router()

AccountController.get('/accounts', async (req, res) => {
    try {
        let data = await paginate(req, 'Account',
            { query: { status: true }, sort: { balanceNumber: -1 } })

        // Format rank.
        let items = data.items
        let baseRank = (data.currentPage - 1) * data.perPage
        for (let i = 0; i < items.length; i++) {
            items[i]['rank'] = baseRank + i + 1
        }
        data.items = items

        return res.json(data)
    } catch (e) {
        logger.error(e)
        return res.status(500).send()
    }
})

AccountController.get('/accounts/:slug', async (req, res) => {
    try {
        let hash = req.params.slug
        hash = hash.toLowerCase()
        let account
        try {
            account = await AccountHelper.getAccountDetail(hash)
        } catch (e) {
            logger.warn(e)
            return res.status(404).json({ message: 'Account is not found!' })
        }
        account = await AccountHelper.formatAccount(account)

        return res.json(account)
    } catch (e) {
        logger.warn(e)
        return res.status(500).send()
    }
})

AccountController.get('/accounts/:slug/mined', async (req, res) => {
    try {
        let hash = req.params.slug
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
        params.sort = { number: -1 }
        let data = await paginate(req, 'Block', params, total)

        return res.json(data)
    } catch (e) {
        logger.warn(e)
        return res.status(500).send()
    }
})

export default AccountController
