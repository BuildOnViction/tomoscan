import Web3Util from './helpers/web3'
import BlockRepository from './repositories/BlockRepository'
import Crawl from './models/Crawl'
import Setting from './models/Setting'
import AccountRepository from './repositories/AccountRepository'
import CrawlRepository from './repositories/CrawlRepository'
import TokenRepository from './repositories/TokenRepository'

const dotenv = require('dotenv')
const mongoose = require('mongoose')
// Load environment variables from .env file
dotenv.load()

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

let watch = async () => {
  while (true) {
    let web3 = await Web3Util.getWeb3()
    let max_block_num = await web3.eth.getBlockNumber()
    let min_block_crawl = await Setting.findOne({meta_key: 'min_block_crawl'})
    min_block_crawl = min_block_crawl ? min_block_crawl.meta_value : 0
    min_block_crawl = parseInt(min_block_crawl)
    if (min_block_crawl <= max_block_num) {
      for (let i = min_block_crawl; i <= min_block_crawl + 20; i++) {
        await CrawlRepository.add('block', i)

        let setting = await Setting.findOne({meta_key: 'min_block_crawl'})
        if (!setting) {
          setting = new Setting
          setting.meta_key = 'min_block_crawl'
          setting.meta_value = 0
        }
        if (i >= parseInt(setting.meta_value)) {
          setting.meta_value = i
        }
        await setting.save()
      }

      let crawls = await Crawl.find({crawl: false}).limit(100)
      if (crawls.length) {
        for (let j = 0; j < crawls.length; j++) {
          let crawl = crawls[j]
          switch (crawl.type) {
            case 'block':
              await BlockRepository.addBlockByNumber(crawl.data)
              break
            case 'tx':
              await TxRepository.getTxPending(crawl.data)
              await TxRepository.getTxReceipt(crawl.data)
              break
            case 'address':
              await AccountRepository.updateAccount(crawl.data)
              break
            case 'token':
              await TokenRepository.updateToken(crawl.data)
              break
          }

          crawl.crawl = true
          crawl.save()

          console.log('--- Crawl data: ' + JSON.stringify(crawl))
        }
      }
    }

    await sleep(500)
  }
}

mongoose.connect(process.env.MONGODB_URI, (err) => {
  if (err) {
    console.log(
      'MongoDB Connection Error. Please make sure that MongoDB is running.')
    process.exit(1)
  }
  else {
    try {
      watch()
    }
    catch (e) {
      if (process.env.APP_ENV === 'prod') {
        var slack = require('slack-notify')(process.env.SLACK_WEBHOOK_URL)
        slack.send({
          channel: '#tm_explorer',
          text: e,
        })
      }
      console.log(e)
    }
  }
})