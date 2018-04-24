import Tx from '../models/Tx'
import AccountRepository from './AccountRepository'
import Web3Util from '../helpers/web3'
import async from 'async'
import Account from '../models/Account'
import Block from '../models/Block'
import BlockRepository from './BlockRepository'

let TxRepository = {
  getTxDetail: async (hash) => {
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

      tx = await Tx.findOneAndUpdate({hash: _tx.hash}, _tx,
        {upsert: true, new: true})

      if (tx.to_id === null) {
        // Get smartcontract address if to is null.
        await TxRepository.getTxReceipt(hash)
      }
    }

    return tx
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
      {block_id: block, blockNumber: block.number, blockHash: block.hash},
      {multi: true})
  },
}

export default TxRepository