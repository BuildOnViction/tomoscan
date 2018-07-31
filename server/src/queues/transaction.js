'use strict'

import Tx from '../models/Tx'
import Web3Util from '../helpers/web3'
import Account from '../models/Account'
import Token from '../models/Token'
import Block from '../models/Block'
import Log from '../models/Log'

const consumer = {}
consumer.name = 'TransactionProcess'
consumer.processNumber = 12
consumer.task = async function(job, done) {
    let hash = job.data.hash
    console.log('Process Transaction: ', hash)
    await getTxPending(hash)
    await getTxReceipt(hash)

    done()
}

async function getTxPending(hash) {
    let tx = await Tx.findOne({ hash: hash })
    let web3 = await Web3Util.getWeb3()
    if (!tx) {
        tx = {}
        tx.hash = hash
    }

    let _tx = await web3.eth.getTransaction(hash)
    if (!_tx) {
        return false
    }

    tx = Object.assign(tx, _tx)

    delete tx['_id']

    await Tx.findOneAndUpdate({ hash: hash }, tx, { upsert: true, new: true })
}

async function getTxReceipt(hash) {
    let tx = await Tx.findOne({ hash: hash })
    let web3 = await Web3Util.getWeb3()
    if (!tx) {
        tx = {}
        tx.hash = hash
    }
    let receipt = await web3.eth.getTransactionReceipt(hash)

    if (!receipt) {
        return false
    }

    if (tx.from !== null) {
        let accountFrom = await Account.findOneAndUpdate(
            {hash: tx.from},
            {hash: tx.from, status: false},
            { upsert: true, new: true }
        )
        tx.from = tx.from.toLowerCase()
        tx.from_model = accountFrom
    }
    if (tx.to !== null) {
        let accountTo = await Account.findOneAndUpdate(
            {hash: tx.to},
            {hash: tx.to, status: false},
            { upsert: true, new: true }
        )
        tx.to = tx.to.toLowerCase()
        tx.to_model = accountTo
    } else {
        if (receipt && typeof receipt.contractAddress !== 'undefined') {
            let contractAddress = receipt.contractAddress.toLowerCase()
            tx.contractAddress = contractAddress
            tx.to_model = await Account.findOneAndUpdate(
                { hash: contractAddress },
                {
                    hash: contractAddress,
                    contractCreation: tx.from,
                    isContract: true
                },
                { upsert: true, new: true })
        }
    }

    tx.cumulativeGasUsed = receipt.cumulativeGasUsed
    tx.gasUsed = receipt.gasUsed
    if (receipt.blockNumber) {
        tx.blockNumber = receipt.blockNumber
        // Find block.
        let block = await Block.findOne({ number: receipt.blockNumber })
        if (block) {
            tx.block = block
        }
    }
    // Parse log.
    let logs = receipt.logs
    tx.logs = logs
    if (logs.length) {
        for (let i = 0; i < logs.length; i++) {
            let log = logs[i]
            await parseLog(log)
            // Save log into db.
            await Log.findOneAndUpdate({ id: log.id }, log,
                { upsert: true, new: true })
        }
    }
    tx.status = receipt.status

    delete tx['_id']

    await Tx.findOneAndUpdate({ hash: hash }, tx,
        { upsert: true, new: true })

}

async function parseLog(log) {

    const TOPIC_TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    if (log.topics[0] !== TOPIC_TRANSFER) {
        return false
    }

    let address = log.address.toLowerCase()
    // Add account and token if not exist in db.
    let token = await Token.findOne({ hash: address })
    const q = require('./index')
    if (!token) {
        console.log('Queue account: ', address)
        console.log('Queue token: ', address)
        await q.create('AccountProcess', {address: address})
            .priority('low').removeOnComplete(true).save()
        await q.create('TokenProcess', {address: address})
            .priority('normal').removeOnComplete(true).save()
    }
    console.log('Queue token transaction: ')
    await q.create('TokenTransactionProcess', {log: JSON.stringify(log)})
        .priority('normal').removeOnComplete(true).save()
}

module.exports = consumer
