'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Account = new Schema({
    hash: { type: String, index: true },
    balance: { type: String },
    balanceNumber: { type: Number, index: true },
    code: String,
    transactionCount: { type: Number, default: 0 },
    minedBlock: { type: Number, default: 0 },
    rewardCount: { type: Number, default: 0 },
    logCount: { type: Number, default: 0 },
    contractCreation: String,
    isContract: { type: Boolean, index: true },
    storageAt: String,
    status: { type: Boolean, default: false, index: true },
    isToken: {
        type: Boolean,
        index: true
    }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model('Account', Account)
