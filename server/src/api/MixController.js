import { Router } from 'express'
import db from '../models'
import Web3Util from '../helpers/web3'

const MixController = Router()

/**
 * get tx, log, mined block reward count
 * @param {String} address hash
 * @returns address information
 */
const getAccount = async (address) => {
    let acc = await db.SpecialAccount.findOne({ hash: address })
    if (acc) {
        return {
            txCount: acc.transactionCount,
            logCount: acc.logCount,
            minedBlocks: acc.minedBlock,
            rewardCount: acc.rewardCount
        }
    } else {
        return {
            txCount: await db.Tx.countDocuments({ $or: [{ from: address }, { to : address }] }),
            logCount: await db.Log.countDocuments({ address: address }),
            minedBlocks: await db.Block.countDocuments({ signer: address }),
            rewardCount: await db.Reward.countDocuments({ address: address })
        }
    }
}

async function getTotalTokenHolders (hash, token) {
    let params = {}
    if (hash) {
        params.query = { hash: hash }
    }
    if (token) {
        params.query = { token: token }
    }
    params.query = Object.assign(params.query, { quantityNumber: { $gte: 0 } })

    return db.TokenHolder.countDocuments(params.query).lean().exec()
}

async function getTotalTokenTx (address, token) {
    let tk = await db.Token.findOne({ hash: address || token })
    if (tk) {
        return tk.txCount
    }
    return 0
}

async function getTotalBlockSigners (blockNumber) {
    let blockSigner = await db.BlockSigner.findOne({ blockNumber: blockNumber })

    let signers = []
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
        if (block.signers) {
            signers = block.signers
        }
    }
    return signers.length
}

async function getTotalTransactions (address, block) {
    let blockNumber = !isNaN(block) ? block : null
    let total = 0
    if (blockNumber) {
        total = await db.Tx.count({ blockNumber: blockNumber })
    }

    if (address) {
        total = await getAccount(address).txCount
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
            case 'address':
                const acc = await getAccount(address)
                result.minedBlocks = acc.minedBlocks
                result.txes = acc.txCount
                result.rewards = acc.rewardCount
                result.events = acc.logCount
                result.tokenHolders = await getTotalTokenHolders(address, hash)
                break
            case 'blocks':
                let blockData = await Promise.all([
                    getTotalTransactions(address, block),
                    getTotalBlockSigners(block)
                ])
                result.txes = blockData[0]
                result.blockSigners = blockData[1]
                break
            case 'token':
                let tokenData = await Promise.all([
                    getTotalTokenHolders(address, token),
                    getTotalTokenTx(address, token)
                ])
                result.tokenHolders = tokenData[0]
                result.tokenTxs = tokenData[1]
                break
            case 'txes':
                const { logCount } = await getAccount(address)
                result.events = logCount
                break
            default:
                break
            }
        }

        return res.json(result)
    } catch (e) {
        console.error(e)
        return res.status(500).send()
    }
})

export default MixController
