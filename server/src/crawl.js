'use strict'

const Web3Util = require('./helpers/web3')
const q = require('./queues')
const db = require('./models')
const events = require('events')
const config = require('config')
const logger = require('./helpers/logger')

// fix warning max listener
events.EventEmitter.defaultMaxListeners = 1000
process.setMaxListeners(1000)

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

let countJobs = () => {
    return new Promise((resolve, reject) => {
        q.inactiveCount((err, l) => {
            if (err) {
                return reject(err)
            }
            return resolve(l)
        })
    })
}

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
            let l = await countJobs()
            if (l > 1000) {
                await sleep(2000)
                logger.debug('%s jobs, sleep 2 seconds before adding more', l)
                continue
            }

            let maxBlockNum = await web3.eth.getBlockNumber()
            if (minBlockCrawl < maxBlockNum) {
                let nextCrawl = minBlockCrawl + step
                nextCrawl = nextCrawl < maxBlockNum ? nextCrawl : maxBlockNum
                for (let i = minBlockCrawl + 1; i <= nextCrawl; i++) {
                    q.create('BlockProcess', { block: i })
                        .priority('high').removeOnComplete(true)
                        .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()

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
                    logger.info('Slack Notification - There is no new block in last 2 minutes')
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
                logger.debug('Sleep 0.5 seconds')
                await sleep(500)
            }
        }
    } catch (e) {
        logger.warn('Sleep 2 seconds before going back to work. Error %s', e)
        await sleep(2000)
        return watch()
    }
}

watch()
