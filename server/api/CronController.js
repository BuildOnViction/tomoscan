import { Router } from 'express'
import Web3Util from '../helpers/web3'
import Setting from '../models/setting'
import Block from '../models/block'
import Transaction from '../models/transaction'
import async from 'async'
import _ from 'lodash'
import BlockRepository from '../repositories/BlockRepository'
import TransactionRepository from '../repositories/TransactionRepository'

const CronController = Router()

CronController.get('/cron/pending', async (req, res) => {
  try {
    let web3 = await Web3Util.getWeb3()
    let max_block_num = await web3.eth.getBlockNumber()
    let pending_block = await Setting.findOne({meta_key: 'pending_block'})
    let pending_block_num = pending_block ? pending_block.meta_value : 0

    if (pending_block_num <= max_block_num) {
      // Insert blocks for crawl.
      let inserted_blocks = parseInt(pending_block_num) + 1000
      let arr_indexs = _.range(pending_block_num, inserted_blocks)
      async.each(arr_indexs, async (i, next) => {
        let exist = await Block.findOne({number: i})
        if (!exist) {
          let block = await Block.create({number: i})
        }

        next()
      }, async (e) => {
        let setting = await Setting.findOneAndUpdate(
          {meta_key: 'pending_block'},
          {meta_value: inserted_blocks}, {upsert: true, new: true})

        res.json({setting: setting})
      })
    }
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

CronController.get('/cron/blocks', async (req, res) => {
  try {
    let web3 = await Web3Util.getWeb3()

    // Get block number minimum.
//    let block = await Block.findOne().sort({number: 1})
//    let block_num_min = block ? block.number : max_block_num
//    for (let i = 1; i <= 20; i++) {
//      if (block_num_min >= 0) {
//        block = await BlockRepository.addBlockByNumber(block_num_min)
//        blocks.push(block)
//        block_num_min--
//      }
//    }
    // Get block pending.
    let blocks = await Block.find({hash: {$exists: false}}).limit(500)
    let _blocks = []
    if (blocks.length) {
      async.each(blocks, async (block, next) => {
        let _block = await BlockRepository.addBlockByNumber(block.number)
        _blocks.push(_block)

        next()
      }, (e) => {
        return res.json({blocks: _blocks})
      })
    } else {
      return res.json({blocks: _blocks})
    }
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

CronController.get('/cron/blocks/:slug', async (req, res) => {
  try {
    let web3 = await Web3Util.getWeb3()
    let result = await web3.eth.getBlock(req.params.slug)

    return res.json(result)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

CronController.get('/cron/txs', async (req, res) => {
  try {
    let transactions = []

    // Get blocks pending transaction.
    let txs = await Transaction.find({nonce: {$exists: false}}).limit(100)

    if (txs.length) {
      async.each(txs, async (tx, next) => {
        let transaction = await TransactionRepository.getTransactionByHash(tx.hash)

        if (transaction) {
          transactions.push(transaction)
        }

        next()
      }, (e) => {
        if (e) {
          console.log(e)
          throw e
        }

        return res.json({transactions: transactions})
      })
    }
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default CronController