import { Router } from 'express'
import Web3Util from '../helpers/web3'
import Setting from '../models/setting'
import Block from '../models/block'
import Transaction from '../models/transaction'
import BlockHelper from '../helpers/block'
import TransactionHelper from '../helpers/transaction'
import async from 'async'

const CronController = Router()

CronController.get('/cron/blocks', async (req, res) => {
  try {
    let web3 = await Web3Util.getWeb3()
    let blocks = []
    let max_block_num = await web3.eth.getBlockNumber()

    // Get block number minimum.
    let block = await Block.findOne().sort({number: 1})
    let block_num_min = block ? block.number : max_block_num
    for (let i = 1; i <= 20; i++) {
      if (block_num_min >= 0) {
        block = await BlockHelper.addBlockByNumber(block_num_min)
        blocks.push(block)
        block_num_min--
      }
    }

    return res.json({blocks: blocks})
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

CronController.get('/cron/blocks/:slug', async(req, res) => {
  try {
    let web3 = await Web3Util.getWeb3()
    let result = await web3.eth.getBlock(req.params.slug)

    return res.json(result)
  } catch(e) {
    console.log(e)
    throw e
  }
})

CronController.get('/cron/txs', async (req, res) => {
  try {
    let transactions = []

    // Get blocks pending transaction.
    let txs = await Transaction.find({crawl: {$exists: false}}).limit(100)

    if (txs.length) {
      async.each(txs, async (tx, next) => {
        let transaction = await TransactionHelper.getTransactionByHash(tx.hash,
          true)

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