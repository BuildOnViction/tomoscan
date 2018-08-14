'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Account = new Schema({
    hash: { type: String, unique: true },
    balance: { type: String },
    balanceNumber: { type: Number },
    code: String,
    transactionCount: Number,
    contractCreation: String,
    isContract: Boolean,
    storageAt: String,
    status: Boolean,
    isToken: Boolean
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model('Account', Account)

