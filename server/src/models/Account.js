'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Account = new Schema({
    hash: { type: String, unique: true, index: true },
    balance: { type: String },
    balanceNumber: Number,
    code: String,
    inTxCount: { type: Number, default: 0 },
    outTxCount: { type: Number, default: 0 },
    totalTxCount: { type: Number, default: 0 },
    internalTxCount: { type: Number, default: 0 },
    tokenTxCount: { type: Number, default: 0 },
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
    },
    hasManyTx: Boolean
}, {
    timestamps: true,
    versionKey: false
})

Account.index({ balanceNumber: -1 })
module.exports = mongoose.model('Account', Account)
