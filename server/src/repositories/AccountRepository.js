import Account from '../models/Account'
import Web3Util from '../helpers/web3'
import Tx from '../models/Tx'
import TokenRepository from './TokenRepository'
import Token from '../models/Token'
import TokenHolder from '../models/TokenHolder'
import Contract from '../models/Contract'

let AccountRepository = {
    async updateAccount (hash) {
        try {
            if (!hash) {
                return false
            }

            hash = hash.toLowerCase()
            let _account = await Account.findOne({ hash: hash, nonce: { $exists: true } })
            _account = _account || {}

            let web3 = await Web3Util.getWeb3()

            let balance = await web3.eth.getBalance(hash)
            if (_account.balance !== balance) {
                _account.balance = balance
                _account.balanceNumber = balance
            }

            let txCount = await Tx.find({ $or: [ { to: hash }, { from: hash } ] }).count()
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

            _account.isContract = (_account.code !== '0x')
            _account.status = true

            delete _account['_id']

            let account = await Account.findOneAndUpdate({ hash: hash }, _account,
                { upsert: true, new: true }).lean()

            return account
        } catch (e) {
            console.trace(e)
            throw e
        }
    },

    async addAccountPending (hash) {
        hash = hash.toLowerCase()

        let account = await Account.findOneAndUpdate({ hash: hash },
            { hash: hash, status: false }, { upsert: true, new: true })
        return account
    },

    async formatItem (address, baseRank) {
    // Find txn create from.
        let fromTxn = null
        if (address.isContract) {
            let tx = await Tx.findOne({
                from: address.contractCreation,
                to: null,
                contractAddress: address.hash
            })
            if (tx) {
                fromTxn = tx.hash
            }
        }
        address.fromTxn = fromTxn

        // Get token.
        let token = null
        if (address.isToken) {
            token = await Token.findOne(
                { hash: address.hash, quantity: { $gte: 0 } })
        }
        address.token = token

        // Inject contract to address object.
        address.contract = await Contract.findOne({ hash: address.hash })

        // Check has token holders.
        let hasTokens = await TokenHolder.findOne({ hash: address.hash })
        address.hashTokens = !!hasTokens

        return address
    },

    async getCode (hash) {
        try {
            if (!hash) { return }

            let code = ''
            let account = await Account.findOne({ hash: hash })
            if (!account) {
                let web3 = await Web3Util.getWeb3()
                code = await web3.eth.getCode(hash)
            } else {
                code = account.code
            }

            return code
        } catch (e) {
            console.trace(e)
            throw e
        }
    }
}

export default AccountRepository
