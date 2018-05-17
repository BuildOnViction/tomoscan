import Tx from '../models/Tx'
import AccountRepository from './AccountRepository'
import Web3Util from '../helpers/web3'
import web3 from 'web3'
import Account from '../models/Account'
import TokenTx from '../models/TokenTx'
import { unformatAddress } from '../helpers/utils'
import Token from '../models/Token'
import TokenRepository from './TokenRepository'
import Block from '../models/Block'
import TokenTxRepository from './TokenTxRepository'
import Follow from '../models/Follow'
import EmailService from '../services/Email'

let TxRepository = {
  async getTxPending (hash) {
    try {
      let tx = await Tx.findOne({hash: hash})
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

      return await Tx.findOneAndUpdate({hash: hash}, tx,
        {upsert: true, new: true})
    }
    catch (e) {
      console.log(e)
      throw e
    }
  },

  async getTxReceipt (hash) {
    try {
      if (!hash) {
        return false
      }
      let tx = await
        Tx.findOne({hash: hash})
      let web3 = await
        Web3Util.getWeb3()
      if (!tx) {
        tx = {}
        tx.hash = hash
      }
      let receipt = await
        web3.eth.getTransactionReceipt(hash)

      if (!receipt) {
        return false
      }

      if (tx.from !== null) {
        tx.from_model = await
          AccountRepository.addAccountPending(tx.from)
      }
      if (tx.to !== null) {
        tx.to_model = await
          AccountRepository.addAccountPending(tx.to)
      }
      else {
        if (receipt && typeof receipt.contractAddress !== 'undefined') {
          tx.contractAddress = receipt.contractAddress
          tx.to_model = await
            Account.findOneAndUpdate(
              {hash: receipt.contractAddress},
              {
                hash: receipt.contractAddress,
                contractCreation: tx.from,
                isContract: true,
              },
              {upsert: true, new: true})
        }
      }

      tx.cumulativeGasUsed = receipt.cumulativeGasUsed
      tx.gasUsed = receipt.gasUsed
      if (receipt.blockNumber) {
        tx.blockNumber = receipt.blockNumber
        // Find block.
        let block = await
          Block.findOne({number: receipt.blockNumber})
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
          await
            TxRepository.parseLog(log)
        }
      }
      tx.status = true

      delete tx['_id']

      tx = await
        Tx.findOneAndUpdate({hash: hash}, tx,
          {upsert: true, new: true})

      return tx
    }
    catch (e) {
      console.log(e)
      throw e
    }
  },

  async parseLog (log) {
    const TOPIC_TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    if (log.topics[0] != TOPIC_TRANSFER) {
      return false
    }

    // Add account and token if not exist in db.
    let token = await Token.findOne({hash: log.address})
    if (!token) {
      let account = await AccountRepository.updateAccount(log.address)
      await TokenRepository.updateToken(account.hash)
    }

    return await TokenTxRepository.addTokenTxFromLog(log)
  },
}

export default TxRepository