const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  hash: {type: String},
  contractName: {type: String},
  compiler: {type: String},
  sourceCode: String,
  abiCode: String,
  functionHashes: {},
  opcodes: String,
  bytecode: String,
  code: String,
  balance: String,
  balanceNumber: Number,
  optimization: Boolean,
  txCount: Number
}, {
  timestamps: true,
  versionKey: false,
})

let Contract = mongoose.model('Contract', schema)

export default Contract