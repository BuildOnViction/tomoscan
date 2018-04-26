import { Router } from 'express'
import { paginate } from '../helpers/utils'

const TokenController = Router()

TokenController.get('/tokens', async (req, res) => {
  try {
    let data = await paginate(req, 'Token',
      {query: {status: true}, sort: {totalSupply: -1}})

    return res.json(data)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default TokenController
