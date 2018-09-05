import { Router } from 'express'
import { paginate } from '../helpers/utils'
import db from '../models'
import TransactionHelper from '../helpers/transaction'
import Web3Util from '../helpers/web3'
import TokenTransactionHelper from '../helpers/tokenTransaction'

const TxController = Router()

TxController.get('/txs', async (req, res) => {
    try {
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
        let populates = [
            {
                path: 'block',
                select: 'timestamp'
            },
            { path: 'from_model' },
            { path: 'to_model' }]
        switch (type) {
        case 'pending':
            params.query = { blockNumber: null, block: null }
            params.limit = 0
            break
        case 'token':
            populates.push(
                { path: 'from_model', match: { isToken: true } })
            populates.push(
                { path: 'to_model', match: { isToken: true } })
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
        params.populate = populates
        // if (!params.sort) {
        //     params.sort = { blockNumber: -1 }
        // }
        let data = await paginate(req, 'Tx', params)

        // If exist blockNumber & not found txs on db (or less than) will get txs on chain
        if (blockNumber) {
            let block = await db.Block.findOne({ number: blockNumber })
            if (block && data.items.length < block.e_tx) {
                let web3 = await Web3Util.getWeb3()
                let _block = await await web3.eth.getBlock(blockNumber, true)
                let trans = _block.transactions
                data = {
                    total: trans.length,
                    perPage: trans.length,
                    currentPage: 1,
                    pages: 1,
                    items: trans
                }
            }
        }

        return res.json(data)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

TxController.get('/txs/:slug', async (req, res) => {
    try {
        let hash = req.params.slug
        hash = hash ? hash.toLowerCase() : hash

        let tx = await TransactionHelper.getTxDetail(hash)
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
        console.trace(e)
        console.log(e)
        return res.status(500).send()
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
        return res.status(500).send()
    }
})

export default TxController
