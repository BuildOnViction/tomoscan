import Web3Util from '../helpers/web3'
import Setting from '../models/Setting'
import _ from 'lodash'
import async from 'async'
import BlockRepository from '../repositories/BlockRepository'
import Transaction from '../models/Transaction'
import TransactionRepository from '../repositories/TransactionRepository'

let cron = require('cron')

let CronTab = {
  getBlocks: () => new Promise(async (resolve, reject) => {
    let web3 = await
      Web3Util.getWeb3()
    let max_block_num = await
      web3.eth.getBlockNumber()
    let max_block_crawl = await
      Setting.findOne({meta_key: 'max_block_crawl'})
    let max_block_crawl_num = max_block_crawl ? max_block_crawl.meta_value
      : max_block_num

    max_block_crawl_num = (max_block_crawl_num == 0)
      ? max_block_num
      : max_block_crawl_num

    let inserted_blocks = parseInt(max_block_crawl_num) - 200
    let arr_indexs = _.range(inserted_blocks, max_block_crawl_num)
    let _blocks = []

    async.each(arr_indexs, async (number, next) => {
      let _block = await BlockRepository.addBlockByNumber(number)
      _blocks.push(_block)

      next()
    }, async (e) => {
      if (e) {
        reject(e)
      }

      let setting = await Setting.findOneAndUpdate(
        {meta_key: 'max_block_crawl'},
        {meta_value: inserted_blocks}, {upsert: true, new: true})

      resolve(_blocks)
    })
  }),

  getTransactions: () => new Promise(async (resolve, reject) => {
    let transactions = []

    // Get blocks pending transaction.
    let txs = await Transaction.find({nonce: {$exists: false}}).limit(200)

    if (txs.length) {
      async.each(txs, async (tx, next) => {
        let transaction = await TransactionRepository.addTransaction(
          tx.hash)

        if (transaction) {
          transactions.push(transaction)
        }

        next()
      }, (e) => {
        if (e) {
          reject(e)
        }

        resolve(transactions)
      })
    }
  }),

  start: () => {
    try {
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
    }
    catch (e) {
      console.log(e)
      throw e
    }
  },
}

export default CronTab