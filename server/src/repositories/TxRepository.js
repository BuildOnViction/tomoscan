import Tx from '../models/Tx'
import AccountRepository from './AccountRepository'
import Web3Util from '../helpers/web3'
import web3 from 'web3'
import Account from '../models/Account'
import TokenTx from '../models/TokenTx'
import BlockRepository from './BlockRepository'
import { unformatAddress } from '../helpers/utils'
import Token from '../models/Token'
import TokenRepository from './TokenRepository'
import Block from '../models/Block'

let TxRepository = {
  getTxDetail: async (hash) => {
    try {
      if (!hash) {
        return false
      }
      let _tx = await Tx.findOne({hash: hash})

      let tx = null
      if (_tx && _tx.crawl) {
        tx = _tx
      }
      else {
        let web3 = await Web3Util.getWeb3()
        // Get tx detail using web3.
        _tx = _tx ? _tx : await web3.eth.getTransaction(hash)
        if (!_tx) {
          return false
        }

        // Insert from account.
        if (_tx && _tx.from != null) {
          let from = await AccountRepository.updateAccount(_tx.from)
          _tx.from_id = from
        }

        // Insert to account.
        if (_tx && _tx.to != null) {
          let to = await AccountRepository.updateAccount(_tx.to)
          _tx.to_id = to
        }

        tx = await Tx.findOneAndUpdate({hash: hash}, _tx,
          {upsert: true, new: true})

        if (tx.to_id === null) {
          // Get smartcontract address if to is null.
          await TxRepository.getTxReceipt(hash)
        }
      }

      return tx
    }
    catch (e) {
      console.log(e)
      throw e
    }
  },

  getTxReceipt: async (hash) => {
    if (!hash) {
      return false
    }
    // Check exist tx receipt.
    let tx = await Tx.findOne({hash: hash})
    if (!tx) {
      tx = TxRepository.getTxDetail(hash)
    }

    if (tx && !tx.blockNumber) {
      let web3 = await Web3Util.getWeb3()
      let receipt = await web3.eth.getTransactionReceipt(hash)

      // Update contract type.
      if (receipt && typeof receipt.contractAddress !== 'undefined') {
        tx.contractAddress = receipt.contractAddress
        await Account.findOneAndUpdate(
          {hash: receipt.contractAddress},
          {hash: receipt.contractAddress, contractCreation: tx.from})
      }

      if (receipt) {
        tx.cumulativeGasUsed = receipt.cumulativeGasUsed
        tx.gasUsed = receipt.gasUsed
        if (receipt.blockNumber) {
          tx.blockNumber = receipt.blockNumber
          // find block.
          let block = BlockRepository.addBlockByNumber(tx.blockNumber)
          tx.block = block
        }
        // Parse log.
        let logs = receipt.logs
        tx.logs = logs
        if (logs.length) {
          logs.forEach((log) => {
            TxRepository.parseLog(log)
          })
        }
      }
    }

    tx.crawl = true

    if (tx) {
      tx = await Tx.findOneAndUpdate({hash: tx.hash}, tx,
        {upsert: true, new: true})
    }

    return tx
  },

  updateBlockForTxs: async (block, hashes) => {
    return await Tx.update({hash: {$in: hashes}},
      {block: block, blockNumber: block.number, blockHash: block.hash},
      {multi: true})
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
    _log.from = unformatAddress(log.topics[1])
    _log.to = unformatAddress(log.topics[2])
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