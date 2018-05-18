const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new mongoose.Schema({
  address: String,
  blockNumber: Number,
  transactionHash: String,
  transactionIndex: Number,
  blockHash: String,
  logIndex: Number,
  removed: Boolean,
  id: String,
  returnValues: {},
  event: String,
  signature: String,
  raw: {},
  functionHash: String,
  functionName: String,
}, {
  timestamps: true,
  versionKey: false,
})

let ContractEvent = mongoose.model('ContractEvent', schema)

export default ContractEvent