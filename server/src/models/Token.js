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
  status: Boolean,
}, {
  timestamps: true,
  toJSON: {virtuals: true, getters: true},
  toObject: {virtuals: true, getters: true},
})

schema.methods.toJSON = function () {
  let obj = this.toObject()

  // Remove non ascii characters.
  obj.name = obj.name.replace(/[^\x00-\x7F]/g, '')
  obj.symbol = obj.name.replace(/[^\x00-\x7F]/g, '')

  return obj
}

let Token = mongoose.model('Token', schema)

export default Token