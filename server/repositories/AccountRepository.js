import Account from '../models/account'
import Web3Util from '../helpers/web3'

let AccountRepository = {
  updateAccount: async (hash) => {
    let web3 = await Web3Util.getWeb3()

    let account = {}
    account.balance = await web3.eth.getBalance(hash)
    account.code = await web3.eth.getCode(hash)
    account.transactionCount = await web3.eth.getTransactionCount(hash)

    return await Account.findOneAndUpdate({hash: hash}, account,
      {upsert: true, new: true})
  },
}

export default AccountRepository