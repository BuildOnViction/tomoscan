import { Router } from 'express'
import { paginate } from '../helpers/utils'
import TokenTxRepository from '../repositories/TokenTxRepository'

const TokenTxController = Router()

TokenTxController.get('/token-txs', async (req, res) => {
    try {
        let token = req.query.token
        let address = req.query.address
        let params = {}
        params.query = {}
        if (token) {
            params.query = { address: token }
        }
        if (address) {
            params.query = Object.assign(params.query,
                { $or: { from: address, to: address } })
        }
        params.populate = [{ path: 'block' }]
        let data = await paginate(req, 'TokenTx', params)

        let items = data.items
        if (items.length) {
            items = await TokenTxRepository.formatItems(items)
        }
        data.items = items

        return res.json(data)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

export default TokenTxController
