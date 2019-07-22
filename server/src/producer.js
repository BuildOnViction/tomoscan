'use strict'

const Web3Util = require('./helpers/web3')
const q = require('./queues')
const db = require('./models')
const events = require('events')
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

const watch = async () => {
    try {
        let step = 100
        let setting = await db.Setting.findOne({ meta_key: 'min_block_crawl' })
        let newJobSetting = await db.Setting.findOne({ meta_key: 'push_new_job' })
        if (!setting) {
            setting = await new db.Setting({
                meta_key: 'min_block_crawl',
                meta_value: 0
            })
        }
        if (!newJobSetting) {
            newJobSetting = await new db.Setting({
                meta_key: 'push_new_job',
                meta_value: 1
            })
            await newJobSetting.save()
        }
        let minBlockCrawl = parseInt(setting.meta_value || 0)

        while (true) {
            let web3 = await Web3Util.getWeb3()
            let l = await countJobs()
            if (l > 500) {
                logger.debug('%s jobs, sleep 2 seconds before adding more', l)
                await sleep(2000)
                continue
            }
            if (String(newJobSetting.meta_value) !== '1') {
                newJobSetting = await db.Setting.findOne({ meta_key: 'push_new_job' })
                logger.debug('Setting is not allow push new job. Sleep 2 seconds and wait to allow')
                await sleep(2000)
                continue
            }

            if (String(newJobSetting.meta_value) === '1') {
                let maxBlockNum = await web3.eth.getBlockNumber()
                logger.debug('Min block crawl %s, Max block number %s', minBlockCrawl, maxBlockNum)
                if (minBlockCrawl < maxBlockNum) {
                    let nextCrawl = minBlockCrawl + step
                    nextCrawl = nextCrawl < maxBlockNum ? nextCrawl : maxBlockNum
                    for (let i = minBlockCrawl + 1; i <= nextCrawl; i++) {
                        logger.info('BlockProcess %s', i)
                        q.create('BlockProcess', { block: i })
                            .priority('high').removeOnComplete(true)
                            .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()

                        minBlockCrawl = i
                    }
                } else {
                    logger.debug('There are no new block. Sleep 2 seconds and wait')
                    await sleep(2000)
                }

                if (minBlockCrawl > parseInt(setting.meta_value)) {
                    setting.meta_value = minBlockCrawl
                    await setting.save()
                    newJobSetting = await db.Setting.findOne({ meta_key: 'push_new_job' })
                }
            }
        }
    } catch (e) {
        logger.warn('Sleep 2 seconds before going back to work. Error %s', e)
        await sleep(2000)
        return watch()
    }
}

watch()
