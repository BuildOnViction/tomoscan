import Web3Util from '../helpers/web3'
import Setting from '../models/Setting'
import _ from 'lodash'
import async from 'async'
import BlockRepository from '../repositories/BlockRepository'
import Tx from '../models/Tx'
import TxRepository from '../repositories/TxRepository'
import Account from '../models/Account'
import TokenRepository from '../repositories/TokenRepository'
import Token from '../models/Token'

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

    let inserted_blocks = parseInt(max_block_crawl_num) - 50
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
    let _txs = await Tx.find({crawl: false}).limit(50)

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

  getTokens: () => new Promise(async (resolve, reject) => {
    let tokens = []

    let _addresses = await Account.find({isToken: {$exists: false}}).limit(50)

    if (_addresses.length) {
      async.each(_addresses, async (_address, next) => {
        let token = await TokenRepository.updateToken(_address)
        tokens.push(token)

        next()
      }, (e) => {
        if (e) {
          reject(e)
        }

        resolve(tokens)
      })
    }
  }),

  start: () => {
    try {
      // For blocks detail.
      let blockJob = new cron.CronJob({
        cronTime: '0 */2 * * * *', // 2 minutes.
        onTick: async () => {
          let sDate = new Date()
          console.log('START blockJob --- ' + sDate.toISOString())

          CronTab.getBlocks().then((blocks) => {
            let eDate = new Date()
            console.log('END blockJob --- ' + eDate.toISOString())
          }).catch((e) => {
            throw e
          })
        },
        start: false,
      })
      // For tx detail.
      let txJob = new cron.CronJob({
        cronTime: '0 */2 * * * *', // 2 minutes.
        onTick: async () => {
          let sDate = new Date()
          console.log('START txJob --- ' + sDate.toISOString())

          CronTab.getTransactions().then((txs) => {
            let eDate = new Date()
            console.log('END txJob --- ' + eDate.toISOString())
          }).catch((e) => {
            throw e
          })
        },
        start: false,
      })
      // For check tx pending remain.
      let txJobPending = new cron.CronJob({
        cronTime: '0 */2 * * * *',
        onTick: async () => {
          let sDate = new Date()
          console.log('START txJobPending --- ' + sDate.toISOString())

          CronTab.getPendingTransactions().then((txs) => {
            let eDate = new Date()
            console.log('END txJobPending --- ' + eDate.toISOString())
          }).catch((e) => {
            throw e
          })
        },
        start: false,
      })
      // For check address is token.
      let tokenJob = new cron.CronJob({
        cronTime: '0 */5 * * * *',
        onTick: async () => {
          let sDate = new Date()
          console.log('START tokenJob --- ' + sDate.toISOString())

          CronTab.getTokens().then((txs) => {
            let eDate = new Date()
            console.log('END tokenJob --- ' + eDate.toISOString())
          }).catch((e) => {
            throw e
          })
        },
        start: false,
      })

      // Start cron job running.
      setTimeout(function () {
        txJob.start()
      }, 10 * 1000)
      setTimeout(function () {
        txJobPending.start()
      }, 20 * 1000)
      setTimeout(function () {
        tokenJob.start()
      }, 10 * 1000)
      blockJob.start()
    }
    catch (e) {
      console.log(e)
      throw e
    }
  },
}

export default CronTab