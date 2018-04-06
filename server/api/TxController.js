import { Router } from 'express'
import Transaction from '../models/transaction'
import { paginate } from '../helpers/utils'
import Web3Util from '../helpers/web3'
import TransactionHelper from '../helpers/transaction'

const TxController = Router()

TxController.get('/txs', async (req, res) => {
  try {
    let per_page = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 10
    let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
    per_page = Math.min(25, per_page)
    let offset = (page - 1) * per_page
    offset = offset ? offset : 0

    let block_num = !isNaN(req.query.block) ? req.query.block : null
    let data = {}
    if (block_num) {
      // Get tnx count.
      let web3 = await Web3Util.getWeb3()
      let tnx_count = await web3.eth.getBlockTransactionCount(block_num)

      let items = []
      let limit = offset + per_page
      limit = Math.min(tnx_count, limit)
      if (offset >= 0) {
        for (let i = offset; i < limit; i++) {
          let tnx = await TransactionHelper.getTransactionFromBlock(block_num,
            i)
          if (tnx) {
            items.push(tnx)
          }
        }
      }

      data = {
        total: tnx_count,
        per_page: per_page,
        current_page: page,
        pages: Math.ceil(tnx_count / per_page),
        items: items,
      }
    }
    else {
      data = await paginate(req, 'Transaction')
    }

    return res.json(data)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default TxController