const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new mongoose.Schema({
  hash: {type: String, unique: true},
  balance: Number,
  code: String,
  transactionCount: Number,
  storageAt: String,
}, {
  timestamps: true,
  toObject: {virtuals: true},
  toJSON: {virtuals: true},
})

schema.path('balance').get(value => '123' + value.toString())

module.exports = mongoose.model('Account', schema)