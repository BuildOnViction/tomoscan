const mongoose = require( 'mongoose' )
const Schema = mongoose.Schema

const schema = new mongoose.Schema( {
	hash: {type: String, unique: true},
	nonce: Number,
	blockHash: String,
	blockNumber: Number,
  transactionHash: String,
	transactionIndex: Number,
	from: String,
	to: String,
	value: String,
	gas: Number,
	gasPrice: String,
	input: String,
  timestamp: Date,
  contractAddress: String,
  cumulativeGasUsed: Number,
  gasUsed: Number,
	block_id: {type: Schema.Types.ObjectId, ref: 'Block'},
	from_id: {type: Schema.Types.ObjectId, ref: 'Account'},
	to_id: {type: Schema.Types.ObjectId, ref: 'Account'},
}, {timestamps: true} )

module.exports = mongoose.model( 'Transaction', schema )