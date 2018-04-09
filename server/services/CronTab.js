import Web3Util from '../helpers/web3'
import Setting from '../models/setting'
import _ from 'lodash'
import async from 'async'
import Block from '../models/block'
import BlockRepository from '../repositories/BlockRepository'
import Transaction from '../models/transaction'
import TransactionRepository from '../repositories/TransactionRepository'

let cron = require('cron')

let CronTab = {
  getBlocksPending: async () => {
    let web3 = await Web3Util.getWeb3()
    let max_block_num = await web3.eth.getBlockNumber()
    let pending_block = Setting.findOne({meta_key: 'pending_block'})
    let pending_block_num = pending_block ? pending_block.meta_value : 0

    if (pending_block_num <= max_block_num) {
      // Insert blocks for crawl.
      let inserted_blocks = parseInt(pending_block_num) + 1000
      inserted_blocks = (inserted_blocks > max_block_num)
        ? max_block_num
        : inserted_blocks
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

        return setting
      })
    }
  },
  getBlocks: async () => {
//    let web3 = await Web3Util.getWeb3()

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
        return _blocks
      })
    }
    else {
      return _blocks
    }
  },

  getTransactions: async () => {
    let transactions = []

    // Get blocks pending transaction.
    let txs = await Transaction.find({nonce: {$exists: false}}).limit(100)

    if (txs.length) {
      async.each(txs, async (tx, next) => {
        let transaction = await TransactionRepository.getTransactionByHash(
          tx.hash)

        if (transaction) {
          transactions.push(transaction)
        }

        next()
      }, (e) => {
        if (e) {
          throw e
        }

        return transactions
      })
    }
  },

  start: () => {
    // For block pending.
    let job_pending = new cron.CronJob({
      cronTime: '0 */5 * * * *', // 5 minutes.
      onTick: () => {
        CronTab.getBlocksPending()

        let date = new Date()
        console.log('Job get block pending running at ' + date.toISOString())
      },
      start: false,
    })
    job_pending.start()

    // For blocks detail.
    let job_blocks = new cron.CronJob({
      cronTime: '0 */2 * * * *', // 2 minutes.
      onTick: () => {
        CronTab.getBlocks()

        let date = new Date()
        console.log('Job get blocks running at ' + date.toISOString())
      },
      start: false,
    })
    job_blocks.start()

    // For tx detail.
    let job_tx = new cron.CronJob({
      cronTime: '0 */2 * * * *', // 2 minutes.
      onTick: () => {
        CronTab.getTransactions()

        let date = new Date()
        console.log('Job get transactions running at ' + date.toISOString())
      },
      start: false,
    })
    job_tx.start()
  },
}

export default CronTab