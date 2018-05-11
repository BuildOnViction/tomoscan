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
    let hash = req.query.hash
    if (hash) {
      params.query = {hash: hash}
    }
    params.sort = {quantityNumber: -1}
    params.query = Object.assign(params.query, {quantityNumber: {$gte: 0}})
    let data = await paginate(req, 'TokenHolder', params)

    let items = data.items
    if (items.length) {
      // Get token totalSupply.
      let totalSupply = null
      if (address) {
        let token = await Token.findOne({hash: address})
        if (token) {
          totalSupply = token.totalSupply
        }
      }
      let length = items.length
      let baseRank = (data.current_page - 1) * data.per_page
      for (let i = 0; i < length; i++) {
        items[i] = await TokenHolderRepository.formatItem(items[i], totalSupply)
        items[i]['rank'] = baseRank + i + 1
      }

      // Get tokens.
      let tokenHashes = []
      for (let i = 0; i < length; i++) {
        tokenHashes.push(items[i]['token'])
      }
      let tokens = await Token.find({hash: {$in: tokenHashes}})
      if (tokens.length) {
        for (let i = 0; i < length; i++) {
          for (let j = 0; j < tokens.length; j++) {
            if (items[i]['token'] == tokens[j]['hash']) {
              items[i]['tokenObj'] = tokens[j]
            }
          }
        }
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