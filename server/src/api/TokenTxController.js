import { Router } from 'express'
import db from '../models'
import { paginate } from '../helpers/utils'
import TokenTransactionHelper from '../helpers/tokenTransaction'
const logger = require('../helpers/logger')

const TokenTxController = Router()

TokenTxController.get('/token-txs', async (req, res) => {
    try {
        let token = req.query.token
        let address = req.query.address
        let params = {}
        params.query = {}
        let total = null
        if (token) {
            params.query = { address: token.toLowerCase() }

            let tk = await db.SpecialAccount.findOne({ hash: token.toLowerCase() })
            if (tk) {
                total = tk.txCount
            }
        }
        if (address) {
            params.query = Object.assign(params.query,
                { $or: [{ from: address.toLowerCase() }, { to: address.toLowerCase() }] })
        }
        params.populate = [{ path: 'block' }]
        let data = await paginate(req, 'TokenTx', params, total)

        let items = data.items
        if (items.length) {
            items = await TokenTransactionHelper.formatTokenTransaction(items)
        }
        data.items = items

        return res.json(data)
    } catch (e) {
        logger.warn(e)
        return res.status(500).send()
    }
})

export default TokenTxController
