import Account from '../models/Account'
import Web3Util from '../helpers/web3'
import Tx from '../models/Tx'
import TokenRepository from './TokenRepository'

let AccountRepository = {
  async updateAccount (hash) {
    if (!hash) {
      return false
    }

    let _account = await Account.findOne({hash: hash, nonce: {$exists: true}})
    _account = _account ? _account : {}

    let web3 = await Web3Util.getWeb3()

    let balance = await web3.eth.getBalance(hash)
    if (_account.balance !== balance) {
      _account.balance = balance
      _account.balanceNumber = balance
    }

    let txCountTo = await Tx.find({to: hash}).count()
    let txCountFrom = await web3.eth.getTransactionCount(hash)
    let txCount = txCountTo + txCountFrom
    if (_account.transactionCount !== txCount) {
      _account.transactionCount = txCount
    }

    let code = await web3.eth.getCode(hash)
    if (_account.code !== code) {
      _account.code = code

      let isToken = await TokenRepository.checkIsToken(code)
      if (isToken) {
        // Insert token pending.
        TokenRepository.addTokenPending(hash)
      }
      _account.isToken = isToken
    }

    _account.isContract = (_account.code !== '0x') ? true : false
    _account.status = true

    delete _account['_id']

    let account = await Account.findOneAndUpdate({hash: hash}, _account,
      {upsert: true, new: true}).lean()

    return account
  },

  async addAccountPending (hash) {
    return await Account.findOneAndUpdate({hash: hash},
      {hash: hash, status: false}, {upsert: true, new: true})
  },

  async formatItem (address) {
    // Find txn create from.
    let fromTxn = null
    if (address.isContract) {
      let tx = await Tx.findOne({
        from: address.contractCreation,
        to: null,
        contractAddress: address.hash,
      })
      fromTxn = tx.hash
    }
    address.fromTxn = fromTxn

    return address
  },
}

export default AccountRepository