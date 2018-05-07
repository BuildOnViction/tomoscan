const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new mongoose.Schema({
  address: String,
  name: String,
  authCode: String,
  sendEmail: Boolean,
  notifyReceive: Boolean,
  notifySent: Boolean,
  user: {type: Schema.Types.ObjectId, ref: 'User'},
}, {
  timestamps: true,
})

let Follow = mongoose.model('Follow', schema)

export default Follow