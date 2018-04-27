import { Router } from 'express'
import { paginate } from '../helpers/utils'
import Token from '../models/Token'

const TokenTxController = Router()

TokenTxController.get('/tokentxs', async (req, res) => {
  try {
    let params = {}
    params.populate = [{path: 'block'}]
    let data = await paginate(req, 'TokenTx', params)

    let items = data.items
    // Append token for each TokenTx.
    if (items.length) {
      let tokenHashes = []
      for (let i = 0; i < items.length; i++) {
        tokenHashes.push(items[i]['address'])
      }
      if (tokenHashes.length) {
        let tokens = await Token.find({hash: {$in: tokenHashes}})
        for (let i = 0; i < items.length; i++) {
          for (let j = 0; j < tokens.length; j++) {
            if (items[i]['address'] == tokens[j]['hash']) {
              items[i].symbol = (typeof tokens[j]['symbol'] !== 'undefined')
                ? tokens[j]['symbol']
                : null
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

export default TokenTxController