'use strict'

import Web3Util from './helpers/web3'
import Setting from './models/Setting'

const config = require('config')
const mongoose = require('mongoose')
const q = require('./queues')

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

let watch = async () => {
    // while (true) {
        let web3 = await Web3Util.getWeb3()
        let maxBlockNum = await web3.eth.getBlockNumber()
        let minBlockCrawl = await Setting.findOne({ meta_key: 'min_block_crawl' })
        minBlockCrawl = minBlockCrawl ? minBlockCrawl.meta_value : 0
        minBlockCrawl = parseInt(minBlockCrawl)
        if (minBlockCrawl < maxBlockNum) {
            let nextCrawl = minBlockCrawl + 20
            nextCrawl = nextCrawl < maxBlockNum ? nextCrawl : maxBlockNum
            for (let i = minBlockCrawl; i <= nextCrawl; i++) {
                console.log('Block queue: ', i)
                await q.create('BlockProcess', {block: i})
                    .priority('normal').removeOnComplete(true).save()

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
                if (i !== 0 && i % 10 === 0){
                    // console.log('Sleep 30 seconds')
                    // await sleep(30000)
                    console.log('process exit')
                    process.exit(1)
                }
            }
        }
    // }
}

mongoose.connect(config.get('MONGODB_URI'), {useNewUrlParser: true}, (err) => {
    if (err) {
        console.log('MongoDB Connection Error. Please make sure that MongoDB is running.')
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
