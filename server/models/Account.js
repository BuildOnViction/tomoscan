import { toLongNumberString } from '../helpers/utils'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new mongoose.Schema({
  hash: {type: String, unique: true},
  balance: {type: Number},
  code: String,
  transactionCount: Number,
  storageAt: String,
}, {
  timestamps: true,
  toObject: {virtuals: true},
  toJSON: {virtuals: true, getters: true},
})

schema.path('balance').get(value => toLongNumberString(value))

let Account = mongoose.model('Account', schema)

export default Account