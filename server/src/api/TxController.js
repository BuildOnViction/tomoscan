import { Router } from 'express'
import db from '../models'
import TransactionHelper from '../helpers/transaction'
import Web3Util from '../helpers/web3'
import TokenTransactionHelper from '../helpers/tokenTransaction'

const TxController = Router()
const contractAddress = require('../contracts/contractAddress')

TxController.get('/txs', async (req, res) => {
    try {
        let perPage = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 25
        perPage = Math.min(25, perPage)
        let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1

        let blockNumber = !isNaN(req.query.block) ? req.query.block : null
        let params = { sort: { blockNumber: -1 } }
        if (blockNumber) {
            params.query = { blockNumber: blockNumber }
        }

        // Check filter type.
        if (req.query.filter) {
            switch (req.query.filter) {
            case 'latest':
                params.sort = { createdAt: -1 }
                break
            }
        }

        // Check type listing is pending.
        let type = req.query.type
        switch (type) {
        case 'pending':
            params.query = { blockNumber: null, block: null }
            params.limit = 0
            break
        case 'token':
            break
        }

        let address = req.query.address
        if (typeof address !== 'undefined') {
            address = address.toLowerCase()
            // if account is contract, has more condition
            let account = await db.Account.findOne({ hash: address })
            if (account && account.isContract) {
                params.query = Object.assign({}, params.query,
                    { $or: [{ from: address }, { to: address }, { contractAddress: address }] })
            } else {
                params.query = Object.assign({}, params.query,
                    { $or: [{ from: address }, { to: address }] })
            }
        }
        // Check type of txs
        if (req.query.typeOfTxs) {
            let condition
            if (req.query.typeOfTxs === 'signTxs') {
                condition = { to: contractAddress.BlockSigner }
            } else if (req.query.typeOfTxs === 'otherTxs') {
                condition = { to: { $ne: contractAddress.BlockSigner } }
            }
            if (params.query) {
                params.query = Object.assign({}, params.query, condition || {})
            } else {
                params.query = condition || {}
            }
        }

        let total = await db.Tx.count(params.query)
        let pages = Math.ceil(total / perPage)
        let offset = page > 1 ? (page - 1) * perPage : 0

        let items = await db.Tx.find(params.query)
            .sort(params.sort)
            .skip(offset).limit(perPage)
            .lean().exec()

        let data = {
            total: total,
            perPage: perPage,
            currentPage: page,
            pages: pages,
            items: items
        }
        // If exist blockNumber & not found txs on db (or less than) will get txs on chain
        if (blockNumber) {
            let block = await db.Block.findOne({ number: blockNumber })

            const offset = page > 1 ? (page - 1) * perPage : 0
            if (block && data.items.length < block.e_tx) {
                const web3 = await Web3Util.getWeb3()

                const _block = await web3.eth.getBlock(blockNumber)

                const trans = _block.transactions
                const items = []
                for (let i = offset; i < (offset + perPage); i++) {
                    if (i < trans.length) {
                        items.push(await web3.eth.getTransaction(trans[i]))
                    } else {
                        break
                    }
                }

                const pages = Math.ceil(trans.length / perPage)
                data = {
                    total: trans.length,
                    perPage: perPage,
                    currentPage: page,
                    pages: pages,
                    items: items
                }
            }
        }

        let listAddress = []
        for (let i = 0; i < data.items.length; i++) {
            let item = data.items[i]
            listAddress.push(item.from)
            if (item.to) {
                listAddress.push(item.to)
            }
        }
        if (listAddress) {
            let newItem = []
            let accounts = await db.Account.find({ hash: { $in: listAddress } })
            for (let i = 0; i < data.items.length; i++) {
                let it = data.items[i]
                for (let j = 0; j < accounts.length; j++) {
                    if (it.from === accounts[j].hash) {
                        it.from_model = accounts[j]
                    }
                    if (it.to === accounts[j].hash) {
                        it.to_model = accounts[j]
                    }
                }
                newItem.push(it)
            }
            data.items = newItem

        }

        return res.json(data)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(406).send()
    }
})

TxController.get('/txs/:slug', async (req, res) => {
    try {
        let hash = req.params.slug
        hash = hash ? hash.toLowerCase() : hash

        let tx
        try {
            tx = await TransactionHelper.getTxDetail(hash)
        } catch (e) {
            console.log(e)
            return res.status(404).json({ message: 'Transaction is not found!' })
        }
        if (!tx) {
            return res.status(404).send()
        }
        tx = tx.toJSON()
        tx.from_model = await db.Account.findOne({ hash: tx.from.toLowerCase() })
        let toModel
        if (tx.to) {
            toModel = await db.Account.findOne({ hash: tx.to.toLowerCase() })
        } else {
            toModel = await db.Account.findOne({ hash: tx.contractAddress.toLowerCase() })
        }
        tx.to_model = toModel

        let tokenTxs = await db.TokenTx.find({ transactionHash: tx.hash })

        tokenTxs = await TokenTransactionHelper.formatTokenTransaction(tokenTxs)
        tx.tokenTxs = tokenTxs

        let web3 = await Web3Util.getWeb3()
        let blk = await web3.eth.getBlock('latest')
        tx.latestBlockNumber = (blk || {}).number || tx.blockNumber

        return res.json(tx)
    } catch (e) {
        console.log(e)
        return res.status(406).send()
    }
})

TxController.get('/txs/status/:hash', async (req, res) => {
    try {
        let hash = req.params.hash
        hash = hash ? hash.toLowerCase() : hash
        let tx = await db.Tx.findOne({ hash: hash })
        let status = false
        if (!tx) {
            let web3 = await Web3Util.getWeb3()
            let receipt = await web3.eth.getTransactionReceipt(hash)
            if (receipt) {
                status = receipt.status
            }
        } else {
            status = tx.status
        }

        return res.json(status)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(406).send()
    }
})

export default TxController
