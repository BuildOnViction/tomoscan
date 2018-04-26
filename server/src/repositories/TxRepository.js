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

let TxRepository = {
  getTxPending: async (hash) => {
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

      if (_tx.from !== null) {
        tx.from_model = await AccountRepository.addAccountPending(_tx.from)
      }
      if (_tx.to !== null) {
        tx.to_model = await AccountRepository.addAccountPending(_tx.to)
      }
      else {
        let receipt = await web3.eth.getTransactionReceipt(hash)
        if (receipt && typeof receipt.contractAddress !== 'undefined') {
          tx.contractAddress = receipt.contractAddress
          tx.to_model = await Account.findOneAndUpdate(
            {hash: receipt.contractAddress},
            {hash: receipt.contractAddress, contractCreation: tx.from})
        }
      }
      tx = Object.assign(tx, _tx)

      return await Tx.findOneAndUpdate({hash: hash}, tx,
        {upsert: true, new: true})
    }
    catch (e) {
      console.log(e)
      throw e
    }
  },

  getTxReceipt: async (hash) => {
    try {
      if (!hash) {
        return false
      }
      let tx = await Tx.findOne({hash: hash})
      let web3 = await Web3Util.getWeb3()
      if (!tx) {
        tx = {}
        tx.hash = hash
      }
      let receipt = await web3.eth.getTransactionReceipt(hash)

      if (!receipt) {
        return false
      }

      tx.cumulativeGasUsed = receipt.cumulativeGasUsed
      tx.gasUsed = receipt.gasUsed
      if (receipt.blockNumber) {
        tx.blockNumber = receipt.blockNumber
        // Find block.
        let block = await Block.findOne({number: receipt.blockNumber})
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
        }
      }
      tx.status = true

      return await Tx.findOneAndUpdate({hash: hash}, tx,
        {upsert: true, new: true})
    }
    catch (e) {
      console.log(e)
      throw e
    }
  },

  parseLog: async (log) => {
    const TOPIC_TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'
    if (log.topics[0] != TOPIC_TRANSFER) {
      return false
    }

    // Add account and token if not exist in db.
    let token = await Token.findOne({hash: log.address})
    if (!token) {
      let account = await AccountRepository.updateAccount(log.address)
      token = await TokenRepository.updateToken(account)
    }

    let _log = log
    if (log.topics[1]) {
      _log.from = unformatAddress(log.topics[1])
    }
    if (log.topics[2]) {
      _log.to = unformatAddress(log.topics[2])
    }
    _log.value = web3.utils.hexToNumberString(log.data)
    _log.valueNumber = _log.value
    // Find block by blockNumber.
    let block = await Block.findOne({number: _log.blockNumber})
    if (block) {
      _log.block = block
    }

    return await TokenTx.findOneAndUpdate(
      {hash: _log.transactionHash, from: _log.from, to: _log.to}, _log,
      {upsert: true, new: true})
  },
}

export default TxRepository