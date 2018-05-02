import { Router } from 'express'
import { paginate } from '../helpers/utils'
import Token from '../models/Token'
import Block from '../models/Block'
import TokenHolderRepository from '../repositories/TokenHolderRepository'

const TokenHolderController = Router()

TokenHolderController.get('/token-holders', async (req, res) => {
  try {
    let address = req.query.address
    let params = {}
    if (address) {
      params.query = {token: address}
    }
    params.sort = {quantityNumber: -1}
    params.query = Object.assign(params.query, {quantityNumber: {$gte: 0}})
    let data = await paginate(req, 'TokenHolder', params)

    let items = data.items
    if (items.length) {
      // Get token totalSupply.
      let token = await Token.findOne({hash: address})
      let baseRank = (data.current_page - 1) * data.per_page
      for (let i = 0; i < items.length; i++) {
        items[i] = await TokenHolderRepository.formatItem(items[i],
          token.totalSupplyNumber)
        items[i]['rank'] = baseRank + i + 1
      }
    }
    data.items = items

    return res.json(data)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default TokenHolderController