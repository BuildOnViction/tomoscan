import { Router } from 'express'
import Tx from '../models/Tx'
import { paginate } from '../helpers/utils'
import Web3Util from '../helpers/web3'
import TxRepository from '../repositories/TxRepository'
import BlockRepository from '../repositories/BlockRepository'

const TxController = Router()

TxController.get('/txs', async (req, res) => {
  try {
    let block_num = !isNaN(req.query.block) ? req.query.block : null
    let params = {query: {hash: {$ne: null}}, sort: {timestamp: -1}}
    if (block_num) {
      params.query = {blockNumber: block_num}
      // Get txs by block number.
      await BlockRepository.addBlockByNumber(block_num)
    }
    // Check type listing is pending.
    let type = req.query.type

    let populates = [{path: 'block_id', select: 'timestamp'}]
    switch (type) {
      case 'pending':
        params.query = {blockNumber: null, block_id: null}
        params.limit = 0
        break
      case 'tokens':
        populates.push(
          {path: 'from_id', select: 'isToken', match: {isToken: true}})
        populates.push(
          {path: 'to_id', select: 'isToken', match: {isToken: true}})
        break
    }
    let address = req.query.address
    if (typeof address !== 'undefined') {
      params.query = Object.assign(params.query,
        {$or: [{from: address}, {to: address}]})
    }
    params.populate = populates
    let data = await paginate(req, 'Tx', params)

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
    let tx = await TxRepository.getTxDetail(hash)
    tx = await TxRepository.getTxReceipt(hash)

    return res.json(tx)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default TxController