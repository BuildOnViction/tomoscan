const db = require('./models')
const events = require('events')
const logger = require('./helpers/logger')
const elastic = require('./helpers/elastic')
const q = require('./queues')
const config = require('config')
const Web3Util = require('./helpers/web3')

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
            logger.debug('Min block index %s, Max block number %s', minBlockCrawl, maxBlockNum)
            let nextCrawl = minBlockCrawl + step
            nextCrawl = nextCrawl < maxBlockNum ? nextCrawl : maxBlockNum
            for (let i = minBlockCrawl + 1; i <= nextCrawl; i++) {
                let block = await db.Block.findOne({ number: i })
                let txes = await db.Tx.find({ blockNumber: i })
                if (!block || block.e_tx > txes.length) {
                    await db.Tx.remove({ blockNumber: i })
                    await db.TokenTx.remove({ blockNumber: i })
                    await db.TokenTrc21Tx.remove({ blockNumber: i })
                    await db.TokenNftTx.remove({ blockNumber: i })
                    await db.InternalTx.remove({ blockNumber: i })
                    q.create('BlockProcess', { block: i })
                        .priority('high').removeOnComplete(true)
                        .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
                } else {
                    if (!block) {
                        block = await web3.eth.getBlock(i)
                    }
                    logger.debug('Index block number %s', i)
                    let b = block.toJSON()
                    delete b['_id']
                    delete b['id']
                    b.finality = block.finality > 100 ? 100 : block.finality
                    await elastic.index(block.hash, 'blocks', b)
                    if (txes.length > 0) {
                        logger.info('Index %s transactions of block %s', txes.length, i)
                    }
                    for (let j = 0; j < txes.length; j++) {
                        let tx = txes[j].toJSON()
                        delete tx['_id']
                        delete tx['id']
                        if (tx.status === '1' || tx.status === 1) {
                            tx.status = true
                        }
                        await elastic.index(tx.hash, 'transactions', tx)
                    }
                    let tokenTx = await db.TokenTx.find({ blockNumber: i })
                    if (tokenTx.length > 0) {
                        logger.info('Index %s trc20-tx of block %s', tokenTx.length, i)
                    }
                    for (let j = 0; j < tokenTx.length; j++) {
                        let tx = tokenTx[j].toJSON()
                        delete tx['_id']
                        delete tx['id']
                        await elastic.indexWithoutId('trc20Tx', tx)
                    }
                    let trc21Tx = await db.TokenTrc21Tx.find({ blockNumber: i })
                    if (trc21Tx.length > 0) {
                        logger.info('Index %s trc21-tx of block %s', trc21Tx.length, i)
                    }
                    for (let j = 0; j < trc21Tx.length; j++) {
                        let tx = trc21Tx[j].toJSON()
                        delete tx['_id']
                        delete tx['id']
                        await elastic.indexWithoutId('trc21Tx', tx)
                    }
                    let nftTx = await db.TokenNftTx.find({ blockNumber: i })
                    if (nftTx.length > 0) {
                        logger.info('Index %s nft-tx of block %s', nftTx.length, i)
                    }
                    for (let j = 0; j < nftTx.length; j++) {
                        let tx = nftTx[j].toJSON()
                        delete tx['_id']
                        delete tx['id']
                        await elastic.indexWithoutId('nftTx', tx)
                    }
                    let internalTx = await db.InternalTx.find({ blockNumber: i })
                    if (internalTx.length > 0) {
                        logger.info('Index %s internal-tx of block %s', internalTx.length, i)
                    }
                    for (let j = 0; j < internalTx.length; j++) {
                        let tx = internalTx[j].toJSON()
                        delete tx['_id']
                        delete tx['id']
                        await elastic.indexWithoutId('internalTx', tx)
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
