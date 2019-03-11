'use strict'

const Web3Util = require('./helpers/web3')
const db = require('./models')
const events = require('events')
const logger = require('./helpers/logger')
const TransactionHelper = require('./helpers/transaction')

// fix warning max listener
events.EventEmitter.defaultMaxListeners = 1000
process.setMaxListeners(1000)

let processTransaction = async (hash) => {
    let tx = await TransactionHelper.getTransaction(hash, true)
    if (tx.from) {
        tx.from = tx.from.toLowerCase()
    }
    if (tx.to) {
        tx.to = tx.to.toLowerCase()
    }
    tx.isPending = true

    await db.SpecialAccount.updateOne(
        { hash: 'transaction' }, { $inc: { pending: 1 } }, { upsert: true, new: true })
    await db.Tx.updateOne({ hash: hash }, tx,
        { upsert: true, new: true })
}

let watch = async () => {
    let web3 = await Web3Util.getWeb3Socket()
    logger.info('start subscribe tx pending')

    await web3.eth.subscribe('pendingTransactions', async (error, txHash) => {
        if (!error) {
            logger.info('new tx pending %s', txHash)
            await processTransaction(txHash)
        }
    }).on('error', async (e) => {
        logger.warn('Something error when get tx pending. Sleep 2 seconds and try more. Error %s', e)
        let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
        await sleep(2000)
        await Web3Util.reconnectWeb3Socket()
        return watch()
    })
}

watch()
