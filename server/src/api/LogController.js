import { Router } from 'express'
import { paginate } from '../helpers/utils'
import LogHelper from '../helpers/log'
import db from '../models'
const logger = require('../helpers/logger')

const LogController = Router()

LogController.get('/logs', async (req, res) => {
    try {
        let address = req.query.address
        let params = {}

        let total = null
        if (address) {
            address = address.toLowerCase()
            params.query = { address: address }

            let acc = await db.SpecialAccount.findOne({ hash: address })
            if (acc) {
                total = acc.logCount
            }
        }
        let tx = req.query.tx
        if (tx) {
            tx = tx.toLowerCase()
            params.query = { transactionHash: tx }
        }
        params.sort = { blockNumber: -1 }
        let data = await paginate(req, 'Log', params, total)
        let items = data.items
        for (let i = 0; i < items.length; i++) {
            data.items[i] = await LogHelper.formatLog(items[i])
        }

        return res.json(data)
    } catch (e) {
        logger.warn(e)
        return res.status(400).send()
    }
})

export default LogController
