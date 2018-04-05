import { Router } from 'express'
import Transaction from '../models/transaction'
import { paginate } from '../helpers/utils'

const TxController = Router()

TxController.get('/txs', async (req, res) => {
  try {
    let data = await paginate(req, 'Transaction')

    return res.json( data )
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default TxController