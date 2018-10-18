'use strict'

import Web3Util from './web3'

const db = require('../models')

let TransactionHelper = {
    parseLog: async (log) => {
        const TOPIC_TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
        if (log.topics[0] !== TOPIC_TRANSFER) {
            return false
        }

        let address = log.address.toLowerCase()
        // Add account and token if not exist in db.
        let token = await db.Token.findOne({ hash: address })
        const q = require('../queues')
        if (!token) {
            q.create('AccountProcess', { address: address })
                .priority('low').removeOnComplete(true).save().on('error', (e) => {
                    throw e
                })
            q.create('TokenProcess', { address: address })
                .priority('normal').removeOnComplete(true).save().on('error', (e) => {
                    throw e
                })
        }
        q.create('TokenTransactionProcess', { log: JSON.stringify(log) })
            .priority('normal').removeOnComplete(true).save().on('error', (e) => {
                throw e
            })
    },
    crawlTransaction: async (hash, timestamp) => {
        hash = hash.toLowerCase()

        try {
            let web3 = await Web3Util.getWeb3()
            let tx = await web3.eth.getTransaction(hash)
            const q = require('../queues')

            if (!tx) {
                return false
            }
            let receipt = await web3.eth.getTransactionReceipt(hash)

            if (!receipt) {
                return false
            }

            if (tx.from !== null) {
                tx.from = tx.from.toLowerCase()
                q.create('AccountProcess', { address: tx.from.toLowerCase() })
                    .priority('normal').removeOnComplete(true).save()
            }
            if (tx.to !== null) {
                tx.to = tx.to.toLowerCase()
                q.create('AccountProcess', { address: tx.to.toLowerCase() })
                    .priority('normal').removeOnComplete(true).save()
            } else {
                if (receipt && typeof receipt.contractAddress !== 'undefined') {
                    let contractAddress = receipt.contractAddress.toLowerCase()
                    tx.contractAddress = contractAddress

                    q.create('AccountProcess', { address: contractAddress })
                        .priority('normal').removeOnComplete(true).save().on('error', (e) => {
                            throw e
                        })

                    await db.Account.findOneAndUpdate(
                        { hash: contractAddress },
                        {
                            hash: contractAddress,
                            contractCreation: tx.from.toLowerCase(),
                            isContract: true
                        },
                        { upsert: true, new: true })
                }
            }

            tx.cumulativeGasUsed = receipt.cumulativeGasUsed
            tx.gasUsed = receipt.gasUsed
            tx.timestamp = timestamp
            if (receipt.blockNumber) {
                tx.blockNumber = receipt.blockNumber
            }

            q.create('FollowProcess', {
                transaction: hash,
                blockNumber: tx.blockNumber,
                fromAccount: tx.from,
                toAccount: tx.to
            }).priority('low').removeOnComplete(true).save()

            // Parse log.
            let logs = receipt.logs
            tx.logs = logs
            if (logs.length) {
                for (let i = 0; i < logs.length; i++) {
                    let log = logs[i]
                    await TransactionHelper.parseLog(log)
                    // Save log into db.
                    await db.Log.findOneAndUpdate({ id: log.id }, log,
                        { upsert: true, new: true })
                }
            }
            tx.status = receipt.status
            tx.isPending = false

            delete tx['_id']

            let trans = await db.Tx.findOneAndUpdate({ hash: hash }, tx,
                { upsert: true, new: true })

            return trans
        } catch (e) {
            console.error(e)
        }
    },
    getTxDetail: async (hash) => {
        hash = hash.toLowerCase()
        let tx = await db.Tx.findOne({ hash: hash })
        if (tx && tx.status) {
            return tx
        } else {
            tx = { hash: hash }
        }
        // let tx = { hash: hash }
        let web3 = await Web3Util.getWeb3()

        let _tx = await web3.eth.getTransaction(hash)

        if (!_tx) {
            return null
        }

        tx = Object.assign(tx, _tx)

        let receipt = await web3.eth.getTransactionReceipt(hash)

        if (!receipt) {
            await db.Tx.findOneAndUpdate({ hash: hash }, tx)
            return tx
        }
        let block = await web3.eth.getBlock(_tx.blockNumber)
        tx.timestamp = block.timestamp * 1000

        tx.cumulativeGasUsed = receipt.cumulativeGasUsed
        tx.gasUsed = receipt.gasUsed
        if (receipt.blockNumber) {
            tx.blockNumber = receipt.blockNumber
        }
        tx.status = receipt.status
        tx.isPending = false
        tx.from = tx.from.toLowerCase()
        if (tx.to) {
            tx.to = tx.to.toLowerCase()
        } else {
            if (receipt && typeof receipt.contractAddress !== 'undefined') {
                let contractAddress = receipt.contractAddress.toLowerCase()
                tx.contractAddress = contractAddress

                await db.Account.findOneAndUpdate(
                    { hash: contractAddress },
                    {
                        hash: contractAddress,
                        contractCreation: tx.from.toLowerCase(),
                        isContract: true
                    },
                    { upsert: true, new: true })
            }
        }

        delete tx['_id']

        let trans = await db.Tx.findOneAndUpdate({ hash: hash }, tx,
            { upsert: true, new: true })
        return trans
    }
}

module.exports = TransactionHelper
