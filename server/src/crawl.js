'use strict'

const Web3Util = require('./helpers/web3')
const q = require('./queues')
const db = require('./models')
const events = require('events')
const config = require('config')

// fix warning max listener
events.EventEmitter.defaultMaxListeners = 1000
process.setMaxListeners(1000)

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

let watch = async () => {
    try {
        let isSend = false
        let isOver2Minutes = 0
        let step = 200
        let setting = await db.Setting.findOne({ meta_key: 'min_block_crawl' })
        let web3 = await Web3Util.getWeb3()
        if (!setting) {
            setting = await new db.Setting({
                meta_key: 'min_block_crawl',
                meta_value: 0
            })
        }
        let minBlockCrawl = parseInt(setting.meta_value || 0)

        while (true) {
            let maxBlockNum = await web3.eth.getBlockNumber()
            if (minBlockCrawl < maxBlockNum) {
                let nextCrawl = minBlockCrawl + step
                nextCrawl = nextCrawl < maxBlockNum ? nextCrawl : maxBlockNum
                for (let i = minBlockCrawl + 1; i <= nextCrawl; i++) {
                    q.create('BlockProcess', { block: i })
                        .priority('high').removeOnComplete(true).save()

                    minBlockCrawl = i
                }
            }

            if (minBlockCrawl > parseInt(setting.meta_value)) {
                setting.meta_value = minBlockCrawl
                isOver2Minutes = 0
                isSend = true
                await setting.save()
            }

            if (String(maxBlockNum) === String(minBlockCrawl)) {
                isOver2Minutes += 0.5 // Similar to 0.5 second

                // send notification after 2 minutes
                if (isOver2Minutes >= 240 && isSend) {
                    let slack = require('slack-notify')(config.get('SLACK_WEBHOOK_URL'))
                    console.log('Slack Notification - There is no new block in last 2 minutes')
                    await slack.send({
                        attachments: [
                            {
                                author_name: 'Slack Bot',
                                title: ':warning: WARNING',
                                color: 'danger',
                                text: '<!channel> There is no new block in last 2 minutes'
                            }
                        ]
                    })
                    isSend = false
                }
                console.log('Sleep 0.1 seconds')
                await sleep(100)
            }
        }
    } catch (e) {
        console.error(e)
        console.error('Sleep 2 seconds before going back to work')
        await sleep(2000)
        return watch()
    }
}

watch()
