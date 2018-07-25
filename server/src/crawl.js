import Web3Util from './helpers/web3'
import BlockRepository from './repositories/BlockRepository'
import Crawl from './models/Crawl'
import Setting from './models/Setting'
import AccountRepository from './repositories/AccountRepository'
import CrawlRepository from './repositories/CrawlRepository'
import TokenRepository from './repositories/TokenRepository'
import TxRepository from './repositories/TxRepository'

const config = require('config')
const mongoose = require('mongoose')

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

let watch = async () => {
    try {
        while (true) {
            let crawls = await Crawl.find({ crawl: false }).limit(100)
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

                    if (config.get('APP_ENV') === 'dev') {
                        console.log('--- Crawl data: ' + JSON.stringify(crawl))
                    }
                }
            }

            let web3 = await Web3Util.getWeb3()
            let maxBlockNum = await web3.eth.getBlockNumber()
            let minBlockCrawl = await Setting.findOne({ meta_key: 'min_block_crawl' })
            minBlockCrawl = minBlockCrawl ? minBlockCrawl.meta_value : 0
            minBlockCrawl = parseInt(minBlockCrawl)
            if (minBlockCrawl < maxBlockNum) {
                let nextCrawl = minBlockCrawl + 20
                nextCrawl = nextCrawl < maxBlockNum ? nextCrawl : maxBlockNum
                for (let i = minBlockCrawl; i <= nextCrawl; i++) {
                    await CrawlRepository.add('block', i)

                    let setting = await Setting.findOne({ meta_key: 'min_block_crawl' })
                    if (!setting) {
                        setting = new Setting()
                        setting.meta_key = 'min_block_crawl'
                        setting.meta_value = 0
                    }
                    if (i >= parseInt(setting.meta_value)) {
                        setting.meta_value = i
                    }
                    await setting.save()
                }
            }

            await sleep(500)
        }
    } catch (e) {
        console.trace(e)
        console.log(e)
    }
}

mongoose.connect(config.get('MONGODB_URI'), (err) => {
    if (err) {
        console.log(
            'MongoDB Connection Error. Please make sure that MongoDB is running.')
        process.exit(1)
    } else {
        try {
            watch()
        } catch (e) {
            if (config.get('APP_ENV') === 'prod') {
                var slack = require('slack-notify')(config.get('SLACK_WEBHOOK_URL'))
                slack.send({
                    channel: '#tm_explorer',
                    text: e
                })
            }
            console.trace(e)
            console.log(e)
        }
    }
})
