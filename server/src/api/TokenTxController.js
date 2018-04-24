import { Router } from 'express'
import { paginate } from '../helpers/utils'

const TokenTxController = Router()

TokenTxController.get('/tokentxs', async (req, res) => {
  try {
    let params = {}
    let data = await paginate(req, 'TokenTx', params)

    return res.json(data)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default TokenTxController