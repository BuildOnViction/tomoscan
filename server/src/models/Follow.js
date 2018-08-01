'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Follow = new Schema({
    address: String,
    name: String,
    authCode: String,
    sendEmail: Boolean,
    notifyReceive: Boolean,
    notifySent: Boolean,
    startBlock: Number,
    user: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model('Follow', Follow)
