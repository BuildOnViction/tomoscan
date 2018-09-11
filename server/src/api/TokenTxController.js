import { Router } from 'express'
import { paginate } from '../helpers/utils'
import TokenTransactionHelper from '../helpers/tokenTransaction'

const TokenTxController = Router()

TokenTxController.get('/token-txs', async (req, res) => {
    try {
        let token = req.query.token
        let address = req.query.address
        let params = {}
        params.query = {}
        if (token) {
            params.query = { address: token.toLowerCase() }
        }
        if (address) {
            params.query = Object.assign(params.query,
                { $or: [{ from: address.toLowerCase() }, { to: address.toLowerCase() }] })
        }
        params.populate = [{ path: 'block' }]
        let data = await paginate(req, 'TokenTx', params)

        let items = data.items
        if (items.length) {
            items = await TokenTransactionHelper.formatTokenTransaction(items)
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
