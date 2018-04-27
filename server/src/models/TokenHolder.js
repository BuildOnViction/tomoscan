const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new mongoose.Schema({
  hash: String,
  quantity: String,
  quantityNumber: Number,
  percentage: Number,
}, {
  timestamps: true,
  toObject: {virtuals: true, getters: true},
  toJSON: {virtuals: true, getters: true},
})

let TokenHolder = mongoose.model('TokenHolder', schema)

export default TokenHolder