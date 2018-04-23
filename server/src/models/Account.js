const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  hash: {type: String, unique: true},
  balance: {type: String},
  balanceNumber: {type: Number},
  code: String,
  transactionCount: Number,
  contractCreation: String,
  storageAt: String,
  status: Boolean,
  status: Boolean,
}, {
  timestamps: true,
//  toJSON: {virtuals: true, getters: true},
})

//schema.path('balance').get(value => toLongNumberString(value))

let Account = mongoose.model('Account', schema)

export default Account