const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new mongoose.Schema({
  hash: {type: String, unique: true, required: true},
  owner: String,
  name: String,
  totalSupply: String,
  totalSupplyNumber: Number,
  symbol: String,
  decimals: Number,
  status: Boolean
})

let Token = mongoose.model('Token', schema)

export default Token