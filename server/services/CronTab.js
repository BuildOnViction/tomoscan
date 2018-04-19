import Web3Util from '../helpers/web3'
import Setting from '../models/Setting'
import _ from 'lodash'
import async from 'async'
import BlockRepository from '../repositories/BlockRepository'
import Tx from '../models/Tx'
import TxRepository from '../repositories/TxRepository'
import Block from '../models/Block'
import Account from '../models/Account'
import AccountRepository from '../repositories/AccountRepository'

let cron = require('cron')

let CronTab = {
  getBlocks: () => new Promise(async (resolve, reject) => {
    let web3 = await
      Web3Util.getWeb3()
    let max_block_num = await
      web3.eth.getBlockNumber()
    let max_block_crawl = await
      Setting.findOne({meta_key: 'max_block_crawl'})
    let max_block_crawl_num = max_block_crawl
      ? max_block_crawl.meta_value
      : max_block_num

    max_block_crawl_num = (max_block_crawl_num == 0)
      ? max_block_num
      : max_block_crawl_num

    let inserted_blocks = parseInt(max_block_crawl_num) - 100
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
    let txs = []

    // Get blocks transaction for crawl.
    let _txs = await Tx.find(
      {crawl: false, blockNumber: {$ne: null}}).limit(200)

    if (_txs.length) {
      async.each(_txs, async (tx, next) => {
        let _tx = await TxRepository.getTxDetail(tx.hash)
        _tx = await TxRepository.getTxReceipt(tx.hash)

        if (_tx) {
          txs.push(_tx)
        }

        next()
      }, (e) => {
        if (e) {
          reject(e)
        }

        resolve(txs)
      })
    }
  }),

  getPendingTransactions: () => new Promise(async (resolve, reject) => {
    let txs = []
    // Get blocks transaction pending for crawl.
    let _txs = await Tx.find({blockNumber: null}).limit(50)

    if (_txs.length) {
      async.each(_txs, async (tx, next) => {
        let _tx = await TxRepository.getTxDetail(tx.hash)
        _tx = await TxRepository.getTxReceipt(tx.hash)

        if (_tx) {
          txs.push(_tx)
        }

        next()
      }, (e) => {
        if (e) {
          reject(e)
        }

        resolve(txs)
      })
    }
  }),

  getAccounts: () => new Promise(async (resolve, reject) => {
    let accounts = []

    let _accounts = await Account.find({crawl: false}).limit(100)
    if (_accounts.length) {
      async.each(_accounts, async (_account, next) => {
        let account = await AccountRepository.updateAccount(_account.hash)
        await AccountRepository.getBalance(_account.hash)
        await AccountRepository.getTransactionCount(_account.hash)
        await AccountRepository.getCode(_account.hash)
        accounts.push(account)
      }, (e) => {
        if (e) {
          reject(e)
        }

        resolve(accounts)
      })
    }
    else {
      await Account.update({crawl: true}, {crawl: false})
    }
  }),

  start: () => {
    try {
      // For blocks detail.
      let blockJob = new cron.CronJob({
        cronTime: '0 */2 * * * *', // 2 minutes.
        onTick: () => {
          CronTab.getBlocks()

          let date = new Date()
          console.log('Job get blocks running at ' + date.toISOString())
        },
        start: false,
      })
      // For tx detail.
      let txJob = new cron.CronJob({
        cronTime: '0 */2 * * * *', // 2 minutes.
        onTick: () => {
          CronTab.getPendingTransactions()

          let date = new Date()
          console.log('Job get transactions running at ' + date.toISOString())
        },
        start: false,
      })
      // For check tx pending remain.
      let txJobPending = new cron.CronJob({
        cronTime: '0 */5 * * * *',
        onTick: () => {
          CronTab.getTransactions()

          let date = new Date()
          console.log('Job get transactions pending remain running at ' +
            date.toISOString())
        },
        start: false,
      })
      // For get accounts.
      let jobAccount = new cron.CronJob({
        cronTime: '0 */2 * * * *',
        onTick: () => {
          CronTab.getAccounts()

          let date = new Date()
          console.log('Job get accounts running at ' +
            date.toISOString())
        },
        start: false,
      })

      // Start cron job running.
      blockJob.start()
      setTimeout(() => {
        txJob.start()
      }, 1000)
      setTimeout(() => {
        jobAccount.start()
      }, 2000)
      setTimeout(() => {
        txJobPending.start()
      }, 3000)
    }
    catch (e) {
      console.log(e)
      throw e
    }
  },
}

export default CronTab