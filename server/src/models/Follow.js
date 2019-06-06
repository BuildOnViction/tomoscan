'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Follow = new Schema({
    address: { type: String, index: true },
    name: String,
    authCode: String,
    sendEmail: { type: Boolean, index: true },
    notifyReceive: Boolean,
    notifySent: Boolean,
    startBlock: { type: Number, index: true }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model('Follow', Follow)
