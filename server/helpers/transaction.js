import Transaction from '../models/transaction'
import AccountHelper from './account'
import Web3Util from './web3'

export default {
	getTransactionByHash: async ( hash, crawl ) => {
		let web3 = await Web3Util.getWeb3()
		let _transaction = await web3.eth.getTransaction( hash )

		// Insert from account.
		if ( _transaction.from != null ) {
			let from = await AccountHelper.updateAccount( _transaction.from )
			_transaction.from_id = from
		}
		// Insert to account.
		if ( _transaction.to != null ) {
			let to = await AccountHelper.updateAccount( _transaction.to )
			_transaction.to_id = to
		}
		_transaction.crawl = crawl

		return await Transaction.findOneAndUpdate( {hash: _transaction.hash}, _transaction, {upsert: true} )
	}
}