import { Router } from 'express'
import Transaction from '../models/Transaction'
import { paginate } from '../helpers/utils'
import Web3Util from '../helpers/web3'
import TransactionRepository from '../repositories/TransactionRepository'

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
      // Get txs by block number.
      let count = await Transaction.find({blockNumber: block_num}).count()

      // Get tnx count.
      let web3 = await Web3Util.getWeb3()
      let tx_count = await web3.eth.getBlockTransactionCount(block_num)
      let items = []
      let limit = offset + per_page
      limit = Math.min(tx_count, limit)
      if (offset >= 0 && tx_count > 0) {
        if (count != tx_count) {
          let _block = await web3.eth.getBlock(block_num)
          for (let i = offset; i < limit; i++) {
            let tx_hash = _block.transactions[i]
            let tx = await Transaction.findOne(
              {hash: tx_hash, blockNumber: block_num}).exec()
            if (!tx) {
              tx = await TransactionRepository.getTxFromBlock(
                block_num, i)
            }
            items.push(tx)
          }
        }
        else {
          items = await Transaction.find({blockNumber: block_num}).
            skip(offset).
            limit(limit).
            exec()
        }
      }

      data = {
        total: tx_count,
        per_page: per_page,
        current_page: page,
        pages: Math.ceil(tx_count / per_page),
        items: items,
      }
    }
    else {
      // Check type listing is pending.
      let type = req.query.type
      let params = {sort: {timestamp: -1}}
      if (type == 'pending') {
        params.query = {blockNumber: null, block_id: null}
        params.limit = 0
      }
      data = await paginate(req, 'Transaction', params)
    }

    return res.json(data)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

TxController.get('/txs/:slug', async (req, res) => {
  try {
    let hash = req.params.slug
    let tx = await TransactionRepository.getTxDetail(hash)
    tx = await TransactionRepository.getTxReceipt(hash)

    return res.json(tx)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default TxController