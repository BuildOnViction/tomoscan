import Transaction from '../models/transaction'
import AccountHelper from './account'
import Web3Util from './web3'

let TransactionHelper = {
  addTransaction: async (_transaction, add_account = true) => {
// Insert from account.
    if (add_account && _transaction.from != null) {
      let from = await AccountHelper.updateAccount(_transaction.from)
      _transaction.from_id = from
    }
    // Insert to account.
    if (add_account && _transaction.to != null) {
      let to = await AccountHelper.updateAccount(_transaction.to)
      _transaction.to_id = to
    }

    return await Transaction.findOneAndUpdate({hash: _transaction.hash},
      _transaction, {upsert: true})
  },

  getTransactionByHash: async (hash) => {
    let web3 = await Web3Util.getWeb3()
    let _transaction = await web3.eth.getTransaction(hash)

    return await TransactionHelper.addTransaction(_transaction)
  },

  getTransactionFromBlock: async (block_num, position) => {
    let web3 = await Web3Util.getWeb3()
    let _transaction = await web3.eth.getTransactionFromBlock(block_num,
      position)

    return await TransactionHelper.addTransaction(_transaction, false)
  },
}

export default TransactionHelper