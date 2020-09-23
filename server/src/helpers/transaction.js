'use strict'

const Web3Util = require('./web3')
const contractAddress = require('../contracts/contractAddress')
const db = require('../models')
const logger = require('./logger')
const BlockHelper = require('./block')
const request = require('request')
const config = require('config')
const BigNumber = require('bignumber.js')
const accountName = require('../contracts/accountName')
const monitorAddress = require('../contracts/monitorAddress')
const utils = require('./utils')
const twitter = require('./twitter')
const elastic = require('./elastic')

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
const TransactionHelper = {
    parseLog: async (log, timestamp) => {
        const TOPIC_TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

        // Topic of Constant-NetworkProxy contract
        const TopicExecuteTrade = '0x1849bd6a030a1bca28b83437fd3de96f3d27a5d172fa7e9c78e7b61468928a39'
        if (log.topics[0] === TOPIC_TRANSFER) {
            const address = log.address.toLowerCase()
            // Add account and token if not exist in db.
            const token = await db.Token.findOne({ hash: address })
            const Queue = require('../queues')
            if (!token) {
                Queue.newQueue('AccountProcess', { listHash: JSON.stringify([address]) })
                Queue.newQueue('TokenProcess', { address: address })
            }
            Queue.newQueue('TokenTransactionProcess', { log: JSON.stringify(log), timestamp: timestamp })
        } else if (log.topics[0] === TopicExecuteTrade) {
            const data = log.data.replace('0x', '')
            const params = []
            for (let i = 0; i < data.length / 64; i++) {
                params.push(data.substr(i * 64, 64))
            }
            const web3 = await Web3Util.getWeb3()
            if (params.length >= 4) {
                const srcAddress = await utils.unformatAddress(params[0])
                let tomoRate
                if (srcAddress === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
                    let tomoAmount = new BigNumber(web3.utils.hexToNumberString('0x' + params[2]))
                    tomoAmount = tomoAmount.dividedBy(10 ** 18)
                    let constantAmount = new BigNumber(web3.utils.hexToNumberString('0x' + params[3]))
                    constantAmount = constantAmount.dividedBy(10 ** 2)

                    tomoRate = constantAmount.dividedBy(tomoAmount).toNumber()
                } else {
                    let tomoAmount = new BigNumber(web3.utils.hexToNumberString('0x' + params[3]))
                    tomoAmount = tomoAmount.dividedBy(10 ** 18)
                    let constantAmount = new BigNumber(web3.utils.hexToNumberString('0x' + params[2]))
                    constantAmount = constantAmount.dividedBy(10 ** 2)

                    tomoRate = constantAmount.dividedBy(tomoAmount).toNumber()
                }

                const txExtraInfo = [
                    {
                        transactionHash: log.transactionHash,
                        infoName: 'Swap rate',
                        infoValue: `1 TOMO = ${tomoRate} CONST`
                    }
                ]
                await db.TxExtraInfo.insertMany(txExtraInfo)
            }
        }
        return false
    },
    crawlTransaction: async (hash, timestamp) => {
        hash = hash.toLowerCase()
        const web3 = await Web3Util.getWeb3()

        try {
            let tx = await db.Tx.findOne({ hash : hash })
            if (!tx) {
                tx = await TransactionHelper.getTransaction(hash, true)
            } else {
                tx = tx.toJSON()
                delete tx._id
                delete tx.id
            }
            const Queue = require('../queues')

            if (!tx) {
                return false
            }
            const receipt = await TransactionHelper.getTransactionReceipt(hash)

            if (!receipt) {
                return false
            }

            const listHash = []
            if (tx.from !== null) {
                tx.from = tx.from.toLowerCase()
                if (tx.to !== contractAddress.BlockSigner && tx.to !== contractAddress.TomoRandomize) {
                    if (!listHash.includes(tx.from.toLowerCase())) {
                        listHash.push(tx.from.toLowerCase())
                    }
                }

                const fromModel = await db.Account.findOne({ hash: tx.from })
                if (fromModel) {
                    tx.from_model = {
                        accountName: accountName[tx.from] ? accountName[tx.from] : '',
                        isContract: fromModel.isContract,
                        contractCreation: fromModel.contractCreation
                    }
                }

                if (monitorAddress.includes(tx.from)) {
                    if (process.env.NODE_ENV === 'mainnet') {
                        logger.error(`@khaihkd @thanhson1085 address ${tx.from} has new transaction. Hash: ${tx.hash}`)
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

                const toModel = await db.Account.findOne({ hash: tx.to })
                if (toModel) {
                    tx.to_model = {
                        accountName: accountName[tx.to] ? accountName[tx.to] : '',
                        isContract: toModel.isContract,
                        contractCreation: toModel.contractCreation
                    }
                }
            } else {
                if (receipt && typeof receipt.contractAddress !== 'undefined') {
                    const contractAddress = receipt.contractAddress.toLowerCase()
                    tx.contractAddress = contractAddress
                    tx.to = contractAddress
                    if (!listHash.includes(contractAddress)) {
                        listHash.push(contractAddress)
                    }

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

            let transferAmount = new BigNumber(tx.value)
            transferAmount = transferAmount.dividedBy(10 ** 18).toNumber()
            if (transferAmount >= 20000 && tx.status) {
                await twitter.alertBigTransfer(tx.hash, tx.from, tx.to, tx.value)
            }

            if (listHash.length > 0) {
                Queue.newQueue('AccountProcess', { listHash: JSON.stringify(listHash) })
            }

            tx.cumulativeGasUsed = receipt.cumulativeGasUsed
            tx.gasUsed = receipt.gasUsed
            tx.timestamp = timestamp
            if (receipt.blockNumber) {
                tx.blockNumber = receipt.blockNumber
            }

            // Parse log.
            const logs = receipt.logs
            if (logs.length) {
                await db.TokenTx.deleteMany({ transactionHash: tx.hash })
                await db.TokenTrc21Tx.deleteMany({ transactionHash: tx.hash })
                await db.TokenNftTx.deleteMany({ transactionHash: tx.hash })
                for (let i = 0; i < logs.length; i++) {
                    const log = logs[i]
                    await TransactionHelper.parseLog(log, timestamp)
                }
                await db.Log.deleteMany({ transactionHash: receipt.hash })
                await db.Log.insertMany(logs)
            }
            let status
            if (typeof receipt.status === 'boolean') {
                status = receipt.status
            } else {
                status = web3.utils.hexToNumber(receipt.status)
            }
            if (status === '1' || status === 1 || status === '0x1') {
                status = true
            }
            if (status === '0' || status === 0 || status === '0x0') {
                status = false
            }
            tx.status = status
            tx.isPending = false

            // Internal transaction
            try {
                await elastic.deleteByQuery('internal-tx', { match: { hash: hash } })
            } catch (e) {
                // logger.warn('dont have internal tx for tx %s', hash)
            }

            if (tx.to !== contractAddress.BlockSigner && tx.to !== contractAddress.TomoRandomize) {
                const internalTx = await TransactionHelper.getInternalTx(tx)
                tx.i_tx = internalTx.length
                for (let i = 0; i < internalTx.length; i++) {
                    const item = internalTx[i]
                    const idx = {
                        hash: item.hash,
                        blockNumber: item.blockNumber,
                        from: item.from,
                        to: item.to,
                        value: item.value,
                        timestamp: (new Date(item.timestamp)).toISOString().replace(/T/, ' ').replace(/\..+/, '')
                    }
                    await elastic.indexWithoutId('internal-tx', idx)
                }
            }
            if (!Number.isInteger(tx.cumulativeGasUsed)) {
                tx.cumulativeGasUsed = web3.utils.hexToNumber(tx.cumulativeGasUsed)
            }
            if (!Number.isInteger(tx.gasUsed)) {
                tx.gasUsed = web3.utils.hexToNumber(tx.gasUsed)
            }
            if (!Number.isInteger(tx.blockNumber)) {
                tx.blockNumber = web3.utils.hexToNumber(tx.blockNumber)
            }
            if (!Number.isInteger(tx.gas)) {
                tx.gas = web3.utils.hexToNumber(tx.gas)
            }
            if (!Number.isInteger(tx.nonce)) {
                tx.nonce = web3.utils.hexToNumber(tx.nonce)
            }
            if (!Number.isInteger(tx.transactionIndex)) {
                tx.transactionIndex = web3.utils.hexToNumber(tx.transactionIndex)
            }

            await db.Tx.updateOne({ hash: hash }, tx,
                { upsert: true, new: true })
            await elastic.index(tx.hash, 'transactions', {
                blockHash: tx.blockHash,
                blockNumber: tx.blockNumber,
                cumulativeGasUsed: tx.cumulativeGasUsed,
                from: tx.from,
                from_model: tx.from_model,
                gas: tx.gas,
                gasPrice: tx.gasPrice,
                gasUsed: tx.gasUsed,
                hash: tx.hash,
                i_tx: tx.i_tx,
                nonce: tx.nonce,
                status: tx.status,
                timestamp: (new Date(tx.timestamp)).toISOString()
                    .replace(/T/, ' ').replace(/\..+/, ''),
                to: tx.to,
                to_model: tx.to_model,
                transactionIndex: tx.transactionIndex,
                value: tx.value
            })
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

        const _tx = await TransactionHelper.getTransaction(hash)

        if (!_tx) {
            return null
        }

        tx = Object.assign(tx, _tx)

        const receipt = await TransactionHelper.getTransactionReceipt(hash)

        if (!receipt) {
            await db.Tx.updateOne({ hash: hash }, tx)
            return tx
        }
        if (!Object.prototype.hasOwnProperty.call(tx, 'timestamp')) {
            const block = await BlockHelper.getBlockOnChain(_tx.blockNumber)
            tx.timestamp = block.timestamp
        }

        tx.cumulativeGasUsed = receipt.cumulativeGasUsed
        if (!Number.isInteger(tx.cumulativeGasUsed)) {
            tx.cumulativeGasUsed = web3.utils.hexToNumber(tx.cumulativeGasUsed)
        }
        tx.gasUsed = receipt.gasUsed
        if (receipt.blockNumber) {
            tx.blockNumber = receipt.blockNumber
        }
        if (!Number.isInteger(tx.gasUsed)) {
            tx.gasUsed = web3.utils.hexToNumber(tx.gasUsed)
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
                const contractAddress = receipt.contractAddress.toLowerCase()
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
        if (tx.to !== contractAddress.BlockSigner && tx.to !== contractAddress.TomoRandomize) {
            const internalTx = await TransactionHelper.getInternalTx(tx)
            tx.i_tx = internalTx.length
        }

        delete tx._id

        return db.Tx.findOneAndUpdate({ hash: hash }, tx,
            { upsert: true, new: true })
    },

    getTransactionReceipt: async (hash, recall = false) => {
        const web3 = await Web3Util.getWeb3()
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
        const web3 = await Web3Util.getWeb3()
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
        const itx = await db.InternalTx.find({ hash: transaction.hash })
        if (itx.length > 0) {
            return itx
        }

        let internalTx = []
        try {
            const result = await new Promise((resolve, reject) => {
                request.post(config.get('WEB3_URI'), {
                    json: {
                        jsonrpc: '2.0',
                        method: 'debug_traceTransaction',
                        params: [transaction.hash, { tracer: 'callTracer', timeout: '10s' }],
                        id: 88
                    },
                    timeout: 10000
                }, (error, res, body) => {
                    if (error) {
                        logger.warn(error)
                        return resolve({ error: 1 })
                    }
                    return resolve(body)
                })
            })
            if (!result.error) {
                const res = result.result
                if (Object.prototype.hasOwnProperty.call(res, 'calls')) {
                    const calls = res.calls
                    internalTx = await TransactionHelper.listInternal(
                        calls, transaction.hash, transaction.blockNumber, transaction.timestamp)
                }
            }
            if (internalTx.length > 0) {
                await db.InternalTx.deleteMany({ hash: transaction.hash })
                await db.InternalTx.insertMany(internalTx)
            }
        } catch (e) {
            logger.warn('Cannot get internal tx. %s', e)
        }
        return internalTx
    },
    listInternal: async (resultCalls, txHash, blockNumber, timestamp) => {
        const web3 = await Web3Util.getWeb3()
        let internals = []
        for (let i = 0; i < resultCalls.length; i++) {
            const call = resultCalls[i]
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
                const childInternal = await TransactionHelper.listInternal(call.calls, txHash, blockNumber, timestamp)
                internals = internals.concat(childInternal)
            }
        }
        return internals
    }
}

module.exports = TransactionHelper
