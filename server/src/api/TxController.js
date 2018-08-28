import { Router } from 'express'
import { paginate } from '../helpers/utils'
import TokenTxRepository from '../repositories/TokenTxRepository'
import db from '../models'
import TransactionHelper from '../helpers/transaction'
import Web3Util from '../helpers/web3'

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
            params.query = Object.assign({}, params.query,
                { $or: [{ from: address }, { to: address }, { contractAddress: address }] })
        }
        params.populate = populates
        if (!params.sort) {
            params.sort = { blockNumber: -1 }
        }
        let data = await paginate(req, 'Tx', params)

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
        tx.from_model = await db.Account.findOne({ hash: tx.from })
        tx.to_model = await db.Account.findOne({ hash: tx.to })

        let tokenTxs = await db.TokenTx.find({ transactionHash: tx.hash })

        tokenTxs = await TokenTxRepository.formatItems(tokenTxs)
        tx.tokenTxs = tokenTxs

        let latestBlock = await db.Block.findOne().sort({ number: -1 })
        tx.latestBlockNumber = latestBlock.number

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
