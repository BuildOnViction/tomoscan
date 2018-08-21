'use strict'

import Web3Util from './web3'

const db = require('../models')

let TransactionHelper = {
    getTxPending: async (hash) => {
        hash = hash.toLowerCase()
        let tx = await db.Tx.findOne({ hash: hash })
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

        let trans = await db.Tx.findOneAndUpdate({ hash: hash }, tx, { upsert: true, new: true })
        return trans
    },

    getTxReceipt: async (hash) => {
        hash = hash.toLowerCase()
        let tx = await db.Tx.findOne({ hash: hash })
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
            let accountFrom = await db.Account.findOneAndUpdate(
                { hash: tx.from.toLowerCase() },
                { hash: tx.from.toLowerCase() },
                { upsert: true, new: true }
            )
            tx.from = tx.from.toLowerCase()
            tx.from_model = accountFrom
        }
        if (tx.to !== null) {
            let accountTo = await db.Account.findOneAndUpdate(
                { hash: tx.to.toLowerCase() },
                { hash: tx.to.toLowerCase() },
                { upsert: true, new: true }
            )
            tx.to = tx.to.toLowerCase()
            tx.to_model = accountTo
        } else {
            if (receipt && typeof receipt.contractAddress !== 'undefined') {
                let contractAddress = receipt.contractAddress.toLowerCase()
                tx.contractAddress = contractAddress
                tx.to_model = await db.Account.findOneAndUpdate(
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
        if (receipt.blockNumber) {
            tx.blockNumber = receipt.blockNumber
            // Find block.
            let block = await db.Block.findOne({ number: receipt.blockNumber })
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
                await TransactionHelper.parseLog(log)
                // Save log into db.
                await db.Log.findOneAndUpdate({ id: log.id }, log,
                    { upsert: true, new: true })
            }
        }
        tx.status = receipt.status

        delete tx['_id']

        let trans = await db.Tx.findOneAndUpdate({ hash: hash }, tx,
            { upsert: true, new: true })
        return trans
    },

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
                .priority('low').removeOnComplete(true).save()
            q.create('TokenProcess', { address: address })
                .priority('normal').removeOnComplete(true).save()
        }
        q.create('TokenTransactionProcess', { log: JSON.stringify(log) })
            .priority('normal').removeOnComplete(true).save()
    }
}

export default TransactionHelper
