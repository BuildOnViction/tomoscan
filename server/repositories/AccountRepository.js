import Account from '../models/Account'
import Web3Util from '../helpers/web3'
import Tx from '../models/Tx'

let AccountRepository = {
  updateAccount: async (hash) => {
    let _account = await Account.findOne({hash: hash, nonce: {$exists: true}})
    _account = _account ? _account : {}

    let web3 = await Web3Util.getWeb3()

    let balance = await web3.eth.getBalance(hash)
    if (_account.balance !== balance) {
      _account.balance = balance
      _account.balanceNumber = balance
    }

    let txCountTo = await Tx.find({to: hash}).count()
    let txCountFrom = 0;//await web3.eth.getTransactionCount(hash)
    let txCount = txCountTo + txCountFrom
    if (_account.transactionCount !== txCount) {
      _account.transactionCount = txCount
    }

    let code = await web3.eth.getCode(hash)
    if (_account.code !== code) {
      _account.code = code
    }

    _account.crawl = false
    _account.status = true

    let account = await Account.findOneAndUpdate({hash: hash}, _account,
      {upsert: true, new: true})

    return account
  },
}

export default AccountRepository