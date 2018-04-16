import Transaction from '../models/Transaction'
import AccountRepository from './AccountRepository'
import Web3Util from '../helpers/web3'
import BlockRepository from './BlockRepository'

let TransactionRepository = {
  addTransaction: async (hash, add_account = true, transaction = null) => {
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

    let receipt = await web3.eth.getTransactionReceipt(_transaction.hash)

    // Insert from account.
    if (add_account && _transaction.from != null) {
      let from = await AccountRepository.updateAccount(_transaction.from)
      _transaction.from_id = from
    }

    // Insert to account.
    if (add_account && _transaction.to != null) {
      let to = await AccountRepository.updateAccount(_transaction.to)
      _transaction.to_id = to
    }

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
    _transaction.logs = receipt.logs

    return await Transaction.findOneAndUpdate({hash: _transaction.hash},
      _transaction, {upsert: true, new: true})
  },

  getTransactionFromBlock: async (block_num, position) => {
    let web3 = await Web3Util.getWeb3()
    let _transaction = await web3.eth.getTransactionFromBlock(block_num,
      position)

    return await TransactionRepository.addTransaction(null, false,
      _transaction)
  },
}

export default TransactionRepository