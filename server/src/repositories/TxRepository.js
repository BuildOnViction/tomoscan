import Tx from '../models/Tx'
import AccountRepository from './AccountRepository'
import Web3Util from '../helpers/web3'
import Account from '../models/Account'
import Token from '../models/Token'
import TokenRepository from './TokenRepository'
import Block from '../models/Block'
import TokenTxRepository from './TokenTxRepository'
import Log from '../models/Log'

let TxRepository = {
    async getTxPending (hash) {
        try {
            let tx = await Tx.findOne({ hash: hash })
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

            return await Tx.findOneAndUpdate({ hash: hash }, tx,
                { upsert: true, new: true })
        } catch (e) {
            console.trace(e)
            return null
        }
    },

    async getTxReceipt (hash) {
        try {
            if (!hash) {
                return false
            }
            let tx = await Tx.findOne({ hash: hash })
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
                tx.from = tx.from.toLowerCase()
                tx.from_model = await AccountRepository.addAccountPending(tx.from)
            }
            if (tx.to !== null) {
                tx.to = tx.to.toLowerCase()
                tx.to_model = await AccountRepository.addAccountPending(tx.to)
            } else {
                if (receipt && typeof receipt.contractAddress !== 'undefined') {
                    let contractAddress = receipt.contractAddress.toLowerCase()
                    tx.contractAddress = contractAddress
                    tx.to_model = await Account.findOneAndUpdate(
                        { hash: contractAddress },
                        {
                            hash: contractAddress,
                            contractCreation: tx.from,
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
                let block = await Block.findOne({ number: receipt.blockNumber })
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
                    await TxRepository.parseLog(log)
                    // Save log into db.
                    await Log.findOneAndUpdate({ id: log.id }, log,
                        { upsert: true, new: true })
                }
            }
            tx.status = receipt.status

            delete tx['_id']

            tx = await Tx.findOneAndUpdate({ hash: hash }, tx,
                { upsert: true, new: true })

            return tx
        } catch (e) {
            console.trace(e)
            return null
        }
    },

    async parseLog (log) {
        const TOPIC_TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
        if (log.topics[0] !== TOPIC_TRANSFER) {
            return false
        }

        let address = log.address.toLowerCase()
        // Add account and token if not exist in db.
        let token = await Token.findOne({ hash: address })
        if (!token) {
            let account = await AccountRepository.updateAccount(
                address)
            await TokenRepository.updateToken(account.hash)
        }

        let tokenTx = await TokenTxRepository.addTokenTxFromLog(log)
        return tokenTx
    }
}

export default TxRepository
