import Web3Util from '../helpers/web3'
import Setting from '../models/Setting'
import _ from 'lodash'
import BlockRepository from '../repositories/BlockRepository'
import Tx from '../models/Tx'
import TxRepository from '../repositories/TxRepository'
import Account from '../models/Account'
import TokenRepository from '../repositories/TokenRepository'
import Token from '../models/Token'
import AccountRepository from '../repositories/AccountRepository'

let cron = require('cron')

let CronTab = {
  getBlocks: async () => {
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

    let inserted_blocks = parseInt(max_block_crawl_num) - 20
    let arr_indexs = _.range(inserted_blocks, max_block_crawl_num)
    let _blocks = []

    for (let i = 0; i < arr_indexs.length; i++) {
      let number = arr_indexs[i]
      let _block = await BlockRepository.addBlockByNumber(number)
      _blocks.push(_block)

      let setting = await Setting.findOneAndUpdate(
        {meta_key: 'max_block_crawl'},
        {meta_value: inserted_blocks}, {upsert: true, new: true})
    }

    return _blocks
  },

  getTransactions: async () => {
    let txs = []

    // Get blocks transaction for crawl.
    let _txs = await Tx.find({status: false}).limit(50)

    for (let i = 0; i < _txs.length; i++) {
      let tx = _txs[i]
      let _tx = await TxRepository.getTxPending(tx.hash)
      _tx = await TxRepository.getTxReceipt(tx.hash)

      if (_tx) {
        txs.push(_tx)
      }
    }

    return txs
  },

  getPendingTransactions: async () => {
    let txs = []
    // Get blocks transaction pending for crawl.
    let _txs = await Tx.find({blockNumber: null}).limit(20)

    for (let i = 0; i < _txs.length; i++) {
      let tx = _txs[i]
      let _tx = await TxRepository.getTxReceipt(tx.hash)

      if (_tx) {
        txs.push(_tx)
      }
      else {
        if (_tx.createdAt + (4 * 60 * 60 * 1000) < Date.now()) {
          await Tx.findOneAndRemove({_id: _tx._id})
        }
      }
    }

    return txs
  },

  getAccounts: async () => {
    let accounts = []
    // Get blocks transaction pending for crawl.
    let records = await Account.find(
      {$or: [{status: {$exists: false}}, {status: false}]}).limit(20)

    if (records.length) {
      for (let i = 0; i < records.length; i++) {
        let record = records[i]
        let account = await AccountRepository.updateAccount(record.hash)
        accounts.push(account)
      }
    }
    else {
      Account.update({status: true}, {status: false})
    }

    return accounts
  },

  getTokens: async () => {
    let tokens = []

    let records = await Token.find(
      {$or: [{status: {$exists: false}}, {status: false}]}).limit(20)

    if (records.length) {
      for (let i = 0; i < records.length; i++) {
        let token = await TokenRepository.updateToken(records[i].hash)
        tokens.push(token)
      }
    }
    else {
      Token.update({status: true}, {status: false})
    }

    return tokens
  },

  start: () => {
    try {
      // For blocks detail.
      let blockJob = new cron.CronJob({
        cronTime: '0 */2 * * * *', // 2 minutes.
        onTick: async () => {
          let sDate = new Date()
          console.log('START blockJob --- ' + sDate.toISOString())

          let blocks = await CronTab.getBlocks()
          if (blocks) {
            let eDate = new Date()
            console.log('END blockJob --- ' + eDate.toISOString())
          }
        },
        start: false,
      })
      // For tx detail.
      let txJob = new cron.CronJob({
        cronTime: '0 */2 * * * *', // 2 minutes.
        onTick: async () => {
          let sDate = new Date()
          console.log('START txJob --- ' + sDate.toISOString())

          let txs = await CronTab.getTransactions()
          if (txs) {
            let eDate = new Date()
            console.log('END txJob --- ' + eDate.toISOString())
          }
        },
        start: false,
      })
      // For account detail.
      let accountJob = new cron.CronJob({
        cronTime: '0 */3 * * * *', // 2 minutes.
        onTick: async () => {
          let sDate = new Date()
          console.log('START accountJob --- ' + sDate.toISOString())

          let txs = await CronTab.getAccounts()
          if (txs) {
            let eDate = new Date()
            console.log('END accountJob --- ' + eDate.toISOString())
          }
        },
        start: false,
      })
      // For check tx pending remain.
      let txJobPending = new cron.CronJob({
        cronTime: '0 */4 * * * *',
        onTick: async () => {
          let sDate = new Date()
          console.log('START txJobPending --- ' + sDate.toISOString())

          let txs = await CronTab.getPendingTransactions()
          if (txs) {
            let eDate = new Date()
            console.log('END txJobPending --- ' + eDate.toISOString())
          }
        },
        start: false,
      })
      // For check address is token.
      let tokenJob = new cron.CronJob({
        cronTime: '0 */5 * * * *',
        onTick: async () => {
          let sDate = new Date()
          console.log('START tokenJob --- ' + sDate.toISOString())

          let tokens = await CronTab.getTokens()
          if (tokens) {
            let eDate = new Date()
            console.log('END tokenJob --- ' + eDate.toISOString())
          }
        },
        start: false,
      })

      // Start cron job running.
      setTimeout(() => {
        blockJob.start()
      }, 1000)
      setTimeout(function () {
        txJob.start()
      }, 10 * 1000)
      setTimeout(function () {
        txJobPending.start()
      }, 20 * 1000)
      setTimeout(() => {
        accountJob.start()
      }, 30 * 1000)
      setTimeout(function () {
        tokenJob.start()
      }, 40 * 1000)
    }
    catch (e) {
      console.log(e)
      throw e
    }
  },
}

export default CronTab