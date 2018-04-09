import Transaction from '../models/transaction'
import AccountRepository from './AccountRepository'
import Web3Util from '../helpers/web3'

let TransactionRepository = {
  addTransaction: async (_transaction, add_account = true) => {
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

    // Get timestamp age.
    let web3 = await Web3Util.getWeb3()
    let _block = await web3.eth.getBlock(_transaction.blockNumber)
    _transaction.timestamp = _block.timestamp * 1000

    return await Transaction.findOneAndUpdate({hash: _transaction.hash},
      _transaction, {upsert: true, new: true})
  },

  getTransactionByHash: async (hash) => {
    let web3 = await Web3Util.getWeb3()
    let _transaction = await web3.eth.getTransaction(hash)

    return await TransactionRepository.addTransaction(_transaction)
  },

  getTransactionFromBlock: async (block_num, position) => {
    let web3 = await Web3Util.getWeb3()
    let _transaction = await web3.eth.getTransactionFromBlock(block_num,
      position)

    return await TransactionRepository.addTransaction(_transaction, false)
  },
}

export default TransactionRepository