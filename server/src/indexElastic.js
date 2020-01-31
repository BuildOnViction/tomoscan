const Web3Util = require('./helpers/web3')
const db = require('./models')
const events = require('events')
const logger = require('./helpers/logger')
const elastic = require('./helpers/elastic')
const q = require('./queues')
const config = require('config')

// fix warning max listener
events.EventEmitter.defaultMaxListeners = 1000
process.setMaxListeners(1000)

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

const watch = async () => {
    try {
        let step = 100
        let setting = await db.Setting.findOne({ meta_key: 'min_block_index' })
        if (!setting) {
            setting = await new db.Setting({
                meta_key: 'min_block_index',
                meta_value: 0
            })
        }
        let minBlockCrawl = parseInt(setting.meta_value || '1')
        let maxBlockNum = parseInt(config.get('MaxBlockIndex'))
        let web3 = await Web3Util.getWeb3()

        while (minBlockCrawl < maxBlockNum) {
            logger.debug('Min block crawl %s, Max block number %s', minBlockCrawl, maxBlockNum)
            let nextCrawl = minBlockCrawl + step
            nextCrawl = nextCrawl < maxBlockNum ? nextCrawl : maxBlockNum
            for (let i = minBlockCrawl + 1; i <= nextCrawl; i++) {
                let block = await db.Block.findOne({ number: i })
                let txes = await db.Tx.find({ blockNumber: i })
                if (block.e_tx > txes.length()) {
                    await db.Tx.remove({ blockNumber: i })
                    await db.TokenTx.remove({ blockNumber: i })
                    await db.TokenTrc21Tx.remove({ blockNumber: i })
                    await db.TokenNftTx.remove({ blockNumber: i })
                    await db.InternalTx.remove({ blockNumber: i })
                    q.create('BlockProcess', { block: i })
                        .priority('high').removeOnComplete(true)
                        .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
                } else {
                    await elastic.index(block.hash, 'blocks', block)
                    for (let j = 0; j < txes.length; j++) {
                        await elastic.index(txes[j].hash, 'transactions', txes[j])
                    }
                    let tokenTx = await db.TokenTx.find({ blockNumber: i })
                    for (let j = 0; j < tokenTx.length; j++) {
                        await elastic.indexWithoutId('trc20Tx', tokenTx[j])
                    }
                    let trc21Tx = await db.TokenTrc21Tx.find({ blockNumber: i })
                    for (let j = 0; j < trc21Tx.length; j++) {
                        await elastic.indexWithoutId('trc21Tx', trc21Tx[j])
                    }
                    let nftTx = await db.TokenNftTx.find({ blockNumber: i })
                    for (let j = 0; j < nftTx.length; j++) {
                        await elastic.indexWithoutId('nftTx', nftTx[j])
                    }
                    let internalTx = await db.InternalTx.find({ blockNumber: i })
                    for (let j = 0; j < internalTx.length; j++) {
                        await elastic.indexWithoutId('internalTx', internalTx[j])
                    }
                }
            }

            minBlockCrawl = nextCrawl
            if (minBlockCrawl > parseInt(setting.meta_value)) {
                setting.meta_value = minBlockCrawl
                await setting.save()
            }
        }
    } catch (e) {
        logger.warn('Sleep 2 seconds before going back to work. Error %s', e)
        await sleep(2000)
        return watch()
    }
}

watch()
