'use strict'

import Web3Util from './helpers/web3'
const q = require('./queues')
const db = require('./models')
const events = require('events')
const emitter = require('./helpers/errorHandler')

// fix warning max listener
events.EventEmitter.defaultMaxListeners = 1000
process.setMaxListeners(1000)

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

let watch = async () => {
    try {
        let step = 200
        let setting = await db.Setting.findOne({ meta_key: 'min_block_crawl' })
        if (!setting) {
            setting = await new db.Setting({
                meta_key: 'min_block_crawl',
                meta_value: 0
            })
        }
        let minBlockCrawl = parseInt(setting.meta_value || 0)

        while (true) {
            let web3 = await Web3Util.getWeb3()
            let maxBlockNum = await web3.eth.getBlockNumber()
            if (minBlockCrawl < maxBlockNum) {
                let nextCrawl = minBlockCrawl + step
                nextCrawl = nextCrawl < maxBlockNum ? nextCrawl : maxBlockNum
                for (let i = minBlockCrawl + 1; i <= nextCrawl; i++) {
                    q.create('BlockProcess', { block: i })
                        .priority('normal').removeOnComplete(true).save()

                    minBlockCrawl = i
                }
            }

            if (minBlockCrawl > parseInt(setting.meta_value)) {
                setting.meta_value = minBlockCrawl
                await setting.save()
            }

            if (String(maxBlockNum) === String(minBlockCrawl)) {
                console.log('Sleep 0.5 seconds')
                await sleep(500)
            }
        }
    } catch (e) {
        emitter.emit('error', e)
    }
}

watch()
