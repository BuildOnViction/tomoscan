import { Router } from 'express'
import mongoose from 'mongoose'
import db from '../models'
import Web3Util from '../helpers/web3'

const MixController = Router()

async function getTotalMinedBlocks (address) {
    const result = await mongoose.model('Block').countDocuments({ signer: address }).lean().exec()
    return result
}

async function getTotalLogs (address) {
    const result = await mongoose.model('Log').countDocuments({ address: address }).lean().exec()
    return result
}

async function getTotalRewards (address) {
    const result = await mongoose.model('Reward').countDocuments({ address: address }).lean().exec()
    return result
}

async function getTotalTokenHolders (address, hash) {
    const params = {}
    if (address) {
        params.query = { token: address }
    }
    if (hash) {
        params.query = { hash: hash }
    }
    params.query = Object.assign(params.query, { quantityNumber: { $gte: 0 } })
    const result = await mongoose.model('TokenHolder').countDocuments(params.query).lean().exec()
    return result
}

async function getTotalTokenTx (address, token) {
    const params = { query: {} }
    if (token) {
        params.query = { address: token }
    }
    if (address) {
        params.query = Object.assign(params.query,
            { $or: [{ from: address }, { to: address }] })
    }
    const result = await mongoose.model('TokenTx').countDocuments(params.query).lean().exec()
    return result
}

async function getTotalBlockSigners (blockNumber) {
    let blockSigner = await db.BlockSigner.findOne({ blockNumber: blockNumber })

    let signers
    let checkInChain = false
    if (blockSigner) {
        if (blockSigner.signers) {
            signers = blockSigner.signers
        } else {
            checkInChain = true
        }
    } else {
        checkInChain = true
    }

    if (checkInChain) {
        let web3 = await Web3Util.getWeb3()

        let block = await web3.eth.getBlock(blockNumber)
        signers = []
        if (block.signers) {
            signers = block.signers
        }
    }
    return signers.length
}

async function getTotalTransactions (address, block) {
    let blockNumber = !isNaN(block) ? block : null
    let params = {}
    if (blockNumber) {
        params.query = { blockNumber: blockNumber }
    }

    if (typeof address !== 'undefined') {
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

    let total = await db.Tx.count(params.query)

    let items = await db.Tx.find(params.query)
        .lean().exec()

    // If exist blockNumber & not found txs on db (or less than) will get txs on chain
    if (blockNumber) {
        let block = await db.Block.findOne({ number: blockNumber })

        if (block && items.length < block.e_tx) {
            const web3 = await Web3Util.getWeb3()

            const _block = await web3.eth.getBlock(blockNumber)

            const trans = _block.transactions

            total = trans.length
        }
    }

    return total
}

MixController.get('/counting', async (req, res) => {
    try {
        const address = (req.query.address || '').toLowerCase()
        const hash = (req.query.hash || '').toLowerCase()
        const token = (req.query.token || '').toLowerCase()
        const block = (req.query.block || '').toLowerCase()

        const result = {}

        const list = req.query.list.split(',')

        for (let i = 0; i < list.length; i++) {
            switch (list[i]) {
            case 'minedBlocks':
                result.minedBlocks = await getTotalMinedBlocks(address) || 0
                break
            case 'events':
                result.events = await getTotalLogs(address) || 0
                break
            case 'rewards':
                result.rewards = await getTotalRewards(address) || 0
                break
            case 'tokenHolders':
                result.tokenHolders = await getTotalTokenHolders(address, hash) || 0
                break
            case 'tokenTxs':
                result.tokenTxs = await getTotalTokenTx(address, token) || 0
                break
            case 'blockSigners':
                result.blockSigners = await getTotalBlockSigners(block) || 0
                break
            case 'txes':
                result.txes = await getTotalTransactions(address, block) || 0
                break
            default:
                break
            }
        }

        return res.json(result)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

export default MixController
