import Tx from '../models/Tx'
import AccountRepository from './AccountRepository'
import Web3Util from '../helpers/web3'
import async from 'async'

let TxRepository = {
  getTxDetail: async (hash, __tx = null) => {
    // Check exist tx.
    let tx = await Tx.findOne({hash: hash})

    if (!tx) {
      let web3 = await Web3Util.getWeb3()

      // Get tx detail using web3.
      let _tx = __tx ? __tx : web3.eth.getTransaction(hash)

      // Insert from account.
      if (_tx.from != null) {
        let from = await AccountRepository.updateAccount(_tx.from)
        _tx.from_id = from
      }

      // Insert to account.
      if (_tx.to != null) {
        let to = await AccountRepository.updateAccount(_tx.to)
        _tx.to_id = to
      }

      tx = await Tx.findOneAndUpdate({hash: _tx.hash},
        _tx, {upsert: true, new: true})
    }

    return tx
  },

  getTxReceipt: async (hash) => {
    // Check exist tx receipt.
    let tx = await Tx.findOne({hash: hash})

    if (!tx.cumulativeGasUsed) {
      let web3 = await Web3Util.getWeb3()
      let receipt = await web3.eth.getTransactionReceipt(hash)

      // Update contract type.
      if (receipt.contractAddress) {
        tx.contractAddress = receipt.contractAddress
        let contract = await AccountRepository.updateAccount(
          receipt.contractAddress)
        contract.contractCreation = tx.from
        contract.save()
      }

      tx.cumulativeGasUsed = receipt.cumulativeGasUsed
      tx.gasUsed = receipt.gasUsed
      tx = await Tx.findOneAndUpdate({hash: tx.hash}, tx,
        {upsert: true, new: true})
    }

    return tx
  },

  addTransaction: async (hash, transaction = null) => {
    let web3 = await Web3Util.getWeb3()
    let _transaction = null

    if (hash && !transaction) {
      _transaction = await Tx.findOne(
        {hash: hash, nonce: {$exists: true}})

      if (_transaction) {
        return _transaction
      }

      _transaction = await web3.eth.getTransaction(hash)
    }
    else {
      _transaction = transaction
    }

    let receipt = await web3.eth.getTransactionReceipt(hash)

    // Insert from account.
    if (_Tx.from != null) {
      let from = await AccountRepository.updateAccount(_Tx.from)
      _Tx.from_id = from
    }

    // Insert to account.
    if (_Tx.to != null) {
      let to = await AccountRepository.updateAccount(_Tx.to)
      _Tx.to_id = to
    }

    if (receipt) {
      // Update contract type.
      if (receipt.contractAddress) {
        _Tx.contractAddress = receipt.contractAddress
        let contract = await AccountRepository.updateAccount(
          receipt.contractAddress)
        contract.contractCreation = _Tx.from
        contract.save()
      }

      // Get timestamp age.
      _Tx.cumulativeGasUsed = receipt.cumulativeGasUsed
      _Tx.gasUsed = receipt.gasUsed
    }

    return await Tx.findOneAndUpdate({hash: _Tx.hash},
      _transaction, {upsert: true, new: true})
  },

  updateBlockForTxs: async (block, hashes) => {
    return await Tx.update({hash: {$in: hashes}},
      {block_id: block, blockNumber: block.number, blockHash: block.hash},
      {multi: true})
  },

  getTxFromBlock: async (block_num, position) => {
    let web3 = await Web3Util.getWeb3()
    let _tx = await web3.eth.getTransactionFromBlock(block_num,
      position)

    return await TxRepository.getTxDetail(null, _tx)
  },

  addTxsFromBlock: async (block, txs) => {
    let _txs = []
    // Sync txs.
    let tx_count = Tx.find({blockNumber: block.number}).count()
    if (tx_count != block.e_tx) {
      // Insert transaction before.
      async.each(txs, async (tx, next) => {
        if (block) {
          tx.block_id = block
        }
        tx.crawl = false
        let _tx = await Tx.findOneAndUpdate({hash: tx.hash}, tx,
          {upsert: true, new: true,},
        )

        _txs.push(_tx)

        next()
      }, (e) => {
        if (e) {
          throw e
        }

        return _txs
      })
    }

    return _txs
  },
}

export default TxRepository