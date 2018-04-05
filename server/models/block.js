const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new mongoose.Schema({
  number: Number,
  hash: {type: String, unique: true},
  parentHash: String,
  nonce: String,
  sha3Uncles: String,
  logsBloom: String,
  transactionsRoot: String,
  stateRoot: String,
  receiptsRoot: String,
  miner: String,
  difficulty: String,
  totalDifficulty: String,
  extraData: String,
  size: Number,
  gasLimit: Number,
  gasUsed: Number,
  timestamp: Date,
  uncles: Array,
  crawl: {type: Boolean, default: false},
  e_tx: {type: Number, default: 0},
}, {
  timestamps: true,
  toObject: {virtuals: true},
  toJSON: {virtuals: true},
})

//schema.virtual('txn').get(async function () {
//  let count = await mongoose.model('Transaction').find({block_id: this._id}).count()
//  console.log(count)
//
//  return count
//})

module.exports = mongoose.model('Block', schema)