import { Router } from 'express'
import { paginate } from '../helpers/utils'
import LogHelper from '../helpers/log'

const LogController = Router()

LogController.get('/logs', async (req, res) => {
    try {
        let address = req.query.address
        let params = {}
        if (address) {
            address = address.toLowerCase()
            params.query = { address: address }
        }
        let tx = req.query.tx
        if (tx) {
            tx = tx.toLowerCase()
            params.query = { transactionHash: tx }
        }
        params.sort = { blockNumber: -1 }
        let data = await paginate(req, 'Log', params)
        let items = data.items
        for (let i = 0; i < items.length; i++) {
            data.items[i] = await LogHelper.formatLog(items[i])
        }

        return res.json(data)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

export default LogController
