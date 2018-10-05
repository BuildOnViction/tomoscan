'use strict'

import Web3Util from './helpers/web3'
const db = require('./models')
const events = require('events')

// fix warning max listener
events.EventEmitter.defaultMaxListeners = 1000
process.setMaxListeners(1000)

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))

let processTransaction = async (hash) => {
    let web3 = await Web3Util.getWeb3()

    let tx = await web3.eth.getTransaction(hash)
    if (tx.from) {
        tx.from = tx.from.toLowerCase()
    }
    if (tx.to) {
        tx.to = tx.to.toLowerCase()
    }
    await db.Tx.findOneAndUpdate({ hash: hash }, tx,
        { upsert: true, new: true })
}

let watch = async () => {
    let web3 = await Web3Util.getWeb3Socket()
    console.log('start subscribe')

    await web3.eth.subscribe('pendingTransactions', function (error, txHash) {
        if (!error) {
            console.log('txHash: ', txHash)
            processTransaction(txHash)
        }
    }).on('data', function (transaction) {

    })
}

watch()
