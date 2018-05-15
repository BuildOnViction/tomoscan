const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  hash: {type: String, unique: true},
  balance: {type: String},
  balanceNumber: {type: Number},
  code: String,
  transactionCount: Number,
  contractCreation: String,
  isContract: Boolean,
  storageAt: String,
  status: Boolean,
  isToken: Boolean,
}, {
  timestamps: true,
  versionKey: false,
})

let Account = mongoose.model('Account', schema)

export default Account