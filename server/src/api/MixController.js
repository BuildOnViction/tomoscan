import { Router } from 'express'
import mongoose from 'mongoose'
import db from '../models'
import Web3Util from '../helpers/web3'
const contractAddress = require('../contracts/contractAddress')

const MixController = Router()

async function getTotalMinedBlocks (address) {
    let result
    if (address === contractAddress.BlockSigner) {
        result = 0
    } else {
        result = await mongoose.model('Block').countDocuments({ signer: address }).lean().exec()
    }
    return result
}

async function getTotalLogs (address) {
    const result = await mongoose.model('Log').countDocuments({ address: address }).lean().exec()
    return result
}

async function getTotalRewards (address) {
    let result
    if (address === contractAddress.BlockSigner) {
        result = 0
    } else {
        result = await mongoose.model('Reward').countDocuments({ address: address }).lean().exec()
    }
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
    let result
    if (token) {
        result = await mongoose.model('TokenTx').countDocuments({ address: token }).lean().exec()
    }
    if (address) {
        const fromCOunt = await mongoose.model('TokenTx').countDocuments({ from: address }).lean().exec()
        const toCount = await mongoose.model('TokenTx').countDocuments({ to: address }).lean().exec()
        const fromToCount = await mongoose.model('TokenTx').countDocuments({ from: address, to: address }).lean().exec()

        result = fromCOunt + toCount - fromToCount
    }

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
    let total
    if (blockNumber) {
        total = await db.Tx.count({ blockNumber: blockNumber })
    }

    if (typeof address !== 'undefined') {
        let account = await db.Account.findOne({ hash: address })
        // if account is contract, has more condition
        if (account && account.isContract) {
            let fromCount = await mongoose.model('Tx').countDocuments({ from: address }).lean().exec()

            let toCount = await mongoose.model('Tx').countDocuments({ to: address }).lean().exec()

            let contractCount = await mongoose.model('Tx')
                .countDocuments({ contractAddress: address }).lean().exec()

            let fromToAddressCount = await mongoose.model('Tx')
                .countDocuments({ from: address, to: address, contractAddress: address }).lean().exec()

            total = fromCount + toCount + contractCount - fromToAddressCount
        } else {
            let fromCount = await mongoose.model('Tx').countDocuments({ from: address }).lean().exec()

            let toCount = await mongoose.model('Tx').countDocuments({ to: address }).lean().exec()

            let fromToCount = await mongoose.model('Tx')
                .countDocuments({ from: address, to: address }).lean().exec()

            total = fromCount + toCount - fromToCount
        }
    }

    // If exist blockNumber & not found txs on db (or less than) will get txs on chain
    if (blockNumber) {
        let block = await db.Block.findOne({ number: blockNumber })

        if (block && total < block.e_tx) {
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

        const result = {
            minedBlocks: 0,
            events: 0,
            rewards: 0,
            txes: 0,
            tokenHolders: 0,
            tokenTxs: 0,
            blockSigners: 0
        }

        const list = req.query.list.split(',')

        for (let i = 0; i < list.length; i++) {
            switch (list[i]) {
            case 'minedBlocks':
                result.minedBlocks = await getTotalMinedBlocks(address)
                break
            case 'events':
                result.events = await getTotalLogs(address)
                break
            case 'rewards':
                result.rewards = await getTotalRewards(address)
                break
            case 'tokenHolders':
                result.tokenHolders = await getTotalTokenHolders(address, hash)
                break
            case 'tokenTxs':
                result.tokenTxs = await getTotalTokenTx(address, token)
                break
            case 'blockSigners':
                result.blockSigners = await getTotalBlockSigners(block)
                break
            case 'transactions':
                result.txes = await getTotalTransactions(address, block)
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
