import { Router } from 'express'
import { paginate } from '../helpers/utils'
import Token from '../models/Token'
import Block from '../models/Block'
import TokenTxRepository from '../repositories/TokenTxRepository'

const TokenTxController = Router()

TokenTxController.get('/token-txs', async (req, res) => {
  try {
    let address = req.query.address
    let params = {}
    if (address) {
      params.query = {address: address}
    }
    params.populate = [{path: 'block'}]
    let data = await paginate(req, 'TokenTx', params)

    let items = data.items
    if (items.length) {
      items = await TokenTxRepository.formatItems(items)
    }
    data.items = items

    return res.json(data)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default TokenTxController