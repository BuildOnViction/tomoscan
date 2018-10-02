'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Account = new Schema({
    hash: { type: String, unique: true, index: true },
    balance: { type: String },
    balanceNumber: { type: Number, index: true },
    code: String,
    transactionCount: Number,
    minedBlock: Number,
    rewardCount: Number,
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
