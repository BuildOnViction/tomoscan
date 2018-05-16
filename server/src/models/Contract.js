const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new mongoose.Schema({
  hash: {type: String},
  name: {type: String},
  compiler: {type: String},
  sourceCode: String,
  abiCode: String,
  code: String,
  balance: String,
  balanceNumber: Number,
}, {
  timestamps: true,
  versionKey: false,
})

let Block = mongoose.model('Block', schema)

export default Block