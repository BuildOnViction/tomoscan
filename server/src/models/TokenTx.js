import Token from './Token'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new mongoose.Schema({
  address: String,
  blockHash: String,
  blockNumber: Number,
  transactionHash: String,
  transactionIndex: Number,
  from: String,
  to: String,
  data: String,
  value: String,
  valueNumber: Number,
  input: String,
  block: {type: Schema.Types.ObjectId, ref: 'Block'},
}, {
  timestamps: true,
  toObject: {virtuals: true, getters: true},
  toJSON: {virtuals: true, getters: true},
})

let TokenTx = mongoose.model('TokenTx', schema)

export default TokenTx