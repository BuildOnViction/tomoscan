'use strict'

const Web3Util = require('./web3')
const contractAddress = require('../contracts/contractAddress')
const db = require('../models')
const logger = require('./logger')
const BlockHelper = require('./block')
const axios = require('axios')
const config = require('config')
const redisHelper = require('./redis')

let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
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
            q.create('AccountProcess', { listHash: JSON.stringify([address]) })
                .priority('low').removeOnComplete(true)
                .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
            q.create('TokenProcess', { address: address })
                .priority('low').removeOnComplete(true)
                .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
        }
        q.create('TokenTransactionProcess', { log: JSON.stringify(log) })
            .priority('normal').removeOnComplete(true)
            .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
    },
    crawlTransaction: async (hash, timestamp) => {
        hash = hash.toLowerCase()
        const web3 = await Web3Util.getWeb3()

        let countProcess = []
        try {
            let tx = await db.Tx.findOne({ hash : hash })
            if (!tx) {
                tx = await TransactionHelper.getTransaction(hash, true)
            } else {
                tx = tx.toJSON()
            }
            const q = require('../queues')

            if (!tx) {
                return false
            }
            let receipt = await TransactionHelper.getTransactionReceipt(hash)

            if (!receipt) {
                return false
            }

            let listHash = []
            if (tx.from !== null) {
                tx.from = tx.from.toLowerCase()
                countProcess.push({
                    hash: tx.from,
                    countType: 'outTx'
                })
                if (tx.to !== contractAddress.BlockSigner && tx.to !== contractAddress.TomoRandomize) {
                    if (!listHash.includes(tx.from.toLowerCase())) {
                        listHash.push(tx.from.toLowerCase())
                    }
                }
            }
            if (tx.to !== null) {
                tx.to = tx.to.toLowerCase()
                if (tx.to !== contractAddress.BlockSigner && tx.to !== contractAddress.TomoRandomize) {
                    if (!listHash.includes(tx.to)) {
                        listHash.push(tx.to)
                    }
                }
                countProcess.push({
                    hash: tx.to,
                    countType: 'inTx'
                })
                let sign = 0
                let other = 0
                if (tx.to === contractAddress.BlockSigner) {
                    sign = 1
                } else {
                    other = 1
                }

                await db.SpecialAccount.updateOne(
                    { hash: 'transaction' }, { $inc: {
                        total: 1,
                        pending: -1,
                        sign: sign,
                        other: other
                    } }, { upsert: true, new: true })
            } else {
                if (receipt && typeof receipt.contractAddress !== 'undefined') {
                    let contractAddress = receipt.contractAddress.toLowerCase()
                    tx.contractAddress = contractAddress
                    tx.to = contractAddress
                    if (!listHash.includes(contractAddress)) {
                        listHash.push(contractAddress)
                    }
                    countProcess.push({
                        hash: tx.to,
                        countType: 'inTx'
                    })

                    await db.Account.updateOne(
                        { hash: contractAddress },
                        {
                            hash: contractAddress,
                            contractCreation: tx.from.toLowerCase(),
                            isContract: true
                        },
                        { upsert: true, new: true })
                }
            }

            if (listHash.length > 0) {
                q.create('AccountProcess', { listHash: JSON.stringify(listHash) })
                    .priority('normal').removeOnComplete(true)
                    .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
            }
            if (countProcess.length > 0) {
                q.create('CountProcess', { data: JSON.stringify(countProcess) })
                    .priority('low').removeOnComplete(true)
                    .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
            }

            tx.cumulativeGasUsed = receipt.cumulativeGasUsed
            tx.gasUsed = receipt.gasUsed
            tx.timestamp = timestamp
            if (receipt.blockNumber) {
                tx.blockNumber = receipt.blockNumber
            }

            // q.create('FollowProcess', {
            //     transaction: hash,
            //     blockNumber: tx.blockNumber,
            //     fromAccount: tx.from,
            //     toAccount: tx.to
            // })
            //     .priority('low').removeOnComplete(true)
            //     .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()

            // Parse log.
            let logs = receipt.logs
            if (logs.length) {
                let logCount = []
                for (let i = 0; i < logs.length; i++) {
                    let log = logs[i]
                    await TransactionHelper.parseLog(log)
                    logCount.push({ hash: log.address.toLowerCase(), countType: 'log' })
                }
                await db.Log.deleteMany({ transactionHash: receipt.hash })
                await db.Log.insertMany(logs)
                if (logCount.length > 0) {
                    q.create('CountProcess', { data: JSON.stringify(logCount) })
                        .priority('low').removeOnComplete(true)
                        .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
                }
            }
            let status
            if (typeof receipt.status === 'boolean') {
                status = receipt.status
            } else {
                status = web3.utils.hexToNumber(receipt.status)
            }
            tx.status = status
            tx.isPending = false

            // Internal transaction
            let internalTx = await TransactionHelper.getInternalTx(tx)
            tx.i_tx = internalTx.length
            let internalCount = []
            for (let i = 0; i < internalTx.length; i++) {
                let item = internalTx[i]
                internalCount.push({ hash: item.from, countType: 'internalTx' })
                internalCount.push({ hash: item.to, countType: 'internalTx' })
            }
            if (internalCount.length > 0) {
                q.create('CountProcess', { data: JSON.stringify(internalCount) })
                    .priority('low').removeOnComplete(true)
                    .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
            }

            await db.Tx.updateOne({ hash: hash }, tx,
                { upsert: true, new: true })
            tx.to_model = await db.Account.findOne({ hash: tx.to })
            let cacheOut = await redisHelper.get(`txs-out-${tx.from}`)
            if (cacheOut !== null) {
                let r1 = JSON.parse(cacheOut)
                let isExist = false
                for (let i = 0; i < r1.items.length; i++) {
                    if (r1.items[i].hash === hash) {
                        isExist = true
                        break
                    }
                }
                if (!isExist) {
                    r1.total += 1
                    r1.items.unshift(tx)
                    r1.items.pop()
                    logger.debug('Update cache out tx of address %s', tx.from)
                    await redisHelper.set(`txs-out-${tx.from}`, JSON.stringify(r1))
                }
            }

            let cacheAll1 = await redisHelper.get(`txs-all-${tx.from}`)
            if (cacheAll1 !== null) {
                let ra1 = JSON.parse(cacheAll1)
                let isExist = false
                for (let i = 0; i < ra1.items.length; i++) {
                    if (ra1.items[i].hash === hash) {
                        isExist = true
                        break
                    }
                }
                if (!isExist) {
                    ra1.total += 1
                    ra1.items.unshift(tx)
                    ra1.items.pop()
                    logger.debug('Update cache all tx of address %s', tx.from)
                    await redisHelper.set(`txs-all-${tx.from}`, JSON.stringify(ra1))
                }
            }
            if (tx.to) {
                let cacheIn = await redisHelper.get(`txs-in-${tx.to}`)
                if (cacheIn !== null) {
                    let r2 = JSON.parse(cacheIn)
                    let isExist = false
                    for (let i = 0; i < r2.items.length; i++) {
                        if (r2.items[i].hash === hash) {
                            isExist = true
                            break
                        }
                    }
                    if (!isExist) {
                        r2.total += 1
                        r2.items.unshift(tx)
                        r2.items.pop()
                        logger.debug('Update cache in tx of address %s', tx.to)
                        await redisHelper.set(`txs-in-${tx.to}`, JSON.stringify(r2))
                    }
                }

                let cacheAll2 = await redisHelper.get(`txs-all-${tx.to}`)
                if (cacheAll2 !== null) {
                    let ra2 = JSON.parse(cacheAll2)
                    let isExist = false
                    for (let i = 0; i < ra2.items.length; i++) {
                        if (ra2.items[i].hash === hash) {
                            isExist = true
                            break
                        }
                    }
                    if (!isExist) {
                        ra2.total += 1
                        ra2.items.unshift(tx)
                        ra2.items.pop()
                        logger.debug('Update cache all tx of address %s', tx.to)
                        await redisHelper.set(`txs-all-${tx.to}`, JSON.stringify(ra2))
                    }
                }
            }
        } catch (e) {
            logger.warn('cannot crawl transaction %s with error %s. Sleep 2 second and retry', hash, e)
            await sleep(2000)
            return TransactionHelper.crawlTransaction(hash, timestamp)
        }
    },
    getTxDetail: async (hash) => {
        const web3 = await Web3Util.getWeb3()
        hash = hash.toLowerCase()
        let tx = await db.Tx.findOne({ hash: hash })
        if (tx && tx.status && tx.gasUsed && tx.gasPrice) {
            tx = tx.toJSON()
            tx.internals = await TransactionHelper.getInternalTx(tx)
            return tx
        } else {
            tx = { hash: hash }
        }

        let _tx = await TransactionHelper.getTransaction(hash)

        if (!_tx) {
            return null
        }

        tx = Object.assign(tx, _tx)

        let receipt = await TransactionHelper.getTransactionReceipt(hash)

        if (!receipt) {
            await db.Tx.updateOne({ hash: hash }, tx)
            return tx
        }
        if (!tx.hasOwnProperty('timestamp')) {
            let block = await BlockHelper.getBlockOnChain(_tx.blockNumber)
            tx.timestamp = block.timestamp
        }

        tx.cumulativeGasUsed = receipt.cumulativeGasUsed
        tx.gasUsed = receipt.gasUsed
        if (receipt.blockNumber) {
            tx.blockNumber = receipt.blockNumber
        }
        let status
        if (typeof receipt.status === 'boolean') {
            status = receipt.status
        } else {
            status = web3.utils.hexToNumber(receipt.status)
        }
        tx.status = status
        tx.isPending = false
        tx.from = tx.from.toLowerCase()
        if (tx.to) {
            tx.to = tx.to.toLowerCase()
        } else {
            if (receipt && typeof receipt.contractAddress !== 'undefined') {
                let contractAddress = receipt.contractAddress.toLowerCase()
                tx.contractAddress = contractAddress

                await db.Account.updateOne(
                    { hash: contractAddress },
                    {
                        hash: contractAddress,
                        contractCreation: tx.from.toLowerCase(),
                        isContract: true
                    },
                    { upsert: true, new: true })
            }
        }

        // Internal transaction
        let internalTx = await TransactionHelper.getInternalTx(tx)
        tx.i_tx = internalTx.length

        delete tx['_id']

        return db.Tx.findOneAndUpdate({ hash: hash }, tx,
            { upsert: true, new: true })
    },

    getTransactionReceipt: async (hash, recall = false) => {
        let web3 = await Web3Util.getWeb3()
        if (recall) {
            return web3.eth.getTransactionReceipt(hash).catch(e => {
                logger.warn('Cannot get tx receipt %s. Sleep 2 seconds and try more. Error %s', hash, e)
                return sleep(2000).then(() => {
                    return TransactionHelper.getTransactionReceipt(hash)
                })
            })
        }
        return web3.eth.getTransactionReceipt(hash)
    },

    getTransaction: async (hash, recall = false) => {
        let web3 = await Web3Util.getWeb3()
        if (recall) {
            return web3.eth.getTransaction(hash).catch(e => {
                logger.warn('Cannot get tx %s. Sleep 2 seconds and try more. Error %s', hash, e)
                return sleep(2000).then(() => {
                    return TransactionHelper.getTransaction(hash)
                })
            })
        }
        return web3.eth.getTransaction(hash)
    },
    getInternalTx: async (transaction) => {
        let itx = await db.InternalTx.find({ hash: transaction.hash })
        if (transaction.i_tx === itx.length) {
            return itx
        }
        let internalTx = []
        let data = {
            'jsonrpc': '2.0',
            'method': 'debug_traceTransaction',
            'params': [transaction.hash, { tracer: 'callTracer' }],
            'id': 88
        }
        const response = await axios.post(config.get('WEB3_URI'), data)
        let result = response.data
        if (!result.error) {
            let res = result.result
            if (res.hasOwnProperty('calls')) {
                let calls = res.calls
                internalTx = await TransactionHelper.listInternal(
                    calls, transaction.hash, transaction.blockNumber, transaction.timestamp)
            }
        }
        if (internalTx.length > 0) {
            await db.InternalTx.deleteMany({ hash: transaction.hash })
            await db.InternalTx.insertMany(internalTx)
        }
        return internalTx
    },
    listInternal: async (resultCalls, txHash, blockNumber, timestamp) => {
        let web3 = await Web3Util.getWeb3()
        let internals = []
        for (let i = 0; i < resultCalls.length; i++) {
            let call = resultCalls[i]
            if (call.value !== '0x0') {
                internals.push({
                    hash: txHash,
                    blockNumber: blockNumber,
                    from: (call.from || '').toLowerCase(),
                    to: (call.to || '').toLowerCase(),
                    value: web3.utils.hexToNumberString(call.value),
                    timestamp: timestamp
                })
            }
            if (call.calls) {
                let childInternal = await TransactionHelper.listInternal(call.calls, txHash, blockNumber, timestamp)
                internals = internals.concat(childInternal)
            }
        }
        return internals
    }
}

module.exports = TransactionHelper
