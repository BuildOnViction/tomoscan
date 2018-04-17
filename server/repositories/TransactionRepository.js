import Transaction from '../models/Transaction'
import AccountRepository from './AccountRepository'
import Web3Util from '../helpers/web3'
import BlockRepository from './BlockRepository'

let TransactionRepository = {
  getTxDetail: async (hash, __tx = null) => {
    // Check exist tx.
    let tx = await Transaction.findOne({hash: hash, nonce: {$exists: true}})
    if (tx) {
      return tx
    }

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

    return await Transaction.findOneAndUpdate({hash: _tx.hash},
      _tx, {upsert: true, new: true})
  },

  getTxReceipt: async (hash) => {
    // Check exist tx receipt.
    let tx = await Transaction.findOne(
      {hash: hash, cumulativeGasUsed: {$ne: null}})
    if (tx) {
      return tx
    }

    let web3 = await Web3Util.getWeb3()
    let receipt = await web3.eth.getTransactionReceipt(hash)

    if (!receipt) {
      return false
    }

    // Update contract type.
    if (receipt.contractAddress) {
      _transaction.contractAddress = receipt.contractAddress
      let contract = await AccountRepository.updateAccount(
        receipt.contractAddress)
      contract.contractCreation = _transaction.from
      contract.save()
    }

    let _tx = {}
    _tx.cumulativeGasUsed = receipt.cumulativeGasUsed
    _tx.gasUsed = receipt.gasUsed

    return await Transaction.findOneAndUpdate({hash: _tx.hash},
      _tx, {upsert: true, new: true})
  },

  addTransaction: async (hash, transaction = null) => {
    let web3 = await Web3Util.getWeb3()
    let _transaction = null

    if (hash && !transaction) {
      _transaction = await Transaction.findOne(
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
    if (_transaction.from != null) {
      let from = await AccountRepository.updateAccount(_transaction.from)
      _transaction.from_id = from
    }

    // Insert to account.
    if (_transaction.to != null) {
      let to = await AccountRepository.updateAccount(_transaction.to)
      _transaction.to_id = to
    }

    if (receipt) {
      // Update contract type.
      if (receipt.contractAddress) {
        _transaction.contractAddress = receipt.contractAddress
        let contract = await AccountRepository.updateAccount(
          receipt.contractAddress)
        contract.contractCreation = _transaction.from
        contract.save()
      }

      // Get timestamp age.
      _transaction.cumulativeGasUsed = receipt.cumulativeGasUsed
      _transaction.gasUsed = receipt.gasUsed
    }

    return await Transaction.findOneAndUpdate({hash: _transaction.hash},
      _transaction, {upsert: true, new: true})
  },

  updateBlockForTxs: async (block, hashes) => {
    return await Transaction.update({hash: {$in: hashes}},
      {block_id: block, blockNumber: block.number, blockHash: block.hash},
      {multi: true})
  },

  getTxFromBlock: async (block_num, position) => {
    let web3 = await Web3Util.getWeb3()
    let _tx = await web3.eth.getTxFromBlock(block_num,
      position)

    return await TransactionRepository.getTxDetail(null, _tx)
  },

  addTxsFromBlock: async (block, txs) => {
    let _txs = []
    // Sync txs.
    let tx_count = Transaction.find({blockNumber: block.number}).count()
    if (tx_count != block.e_tx) {
      // Insert transaction before.
      async.each(txs, async (tx, next) => {
        tx.block_id = block
        tx.crawl = false
        let _tx = await Transaction.findOneAndUpdate({hash: tx.hash}, tx,
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

export default TransactionRepository