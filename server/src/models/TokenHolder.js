const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new mongoose.Schema({
  hash: String,
  token: String,
  quantity: String,
}, {
  timestamps: true,
  toObject: {virtuals: true, getters: true},
  toJSON: {virtuals: true, getters: true},
  versionKey: false,
})

let TokenHolder = mongoose.model('TokenHolder', schema)

export default TokenHolder