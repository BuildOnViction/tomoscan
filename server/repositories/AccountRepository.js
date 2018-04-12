import Account from '../models/Account'
import Web3Util from '../helpers/web3'

let AccountRepository = {
  updateAccount: async (hash) => {
    let web3 = await Web3Util.getWeb3()

    let account = {}
    let balance = await web3.eth.getBalance(hash)
    account.balance = balance
    account.balanceNumber = balance
    account.code = await web3.eth.getCode(hash)
    account.transactionCount = await web3.eth.getTransactionCount(hash)

    return await Account.findOneAndUpdate({hash: hash}, account,
      {upsert: true, new: true})
  },
}

export default AccountRepository