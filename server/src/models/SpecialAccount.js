'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SpecialAccount = new Schema({
    hash: { type: String, unique: true, index: true },
    inTransactionCount: { type: Number, default: 0 },
    outTransactionCount: { type: Number, default: 0 },
    contractTransactionCount: { type: Number, default: 0 },
    totalTransactionCount: { type: Number, default: 0 },
    minedBlock: { type: Number, default: 0 },
    rewardCount: { type: Number, default: 0 },
    logCount: { type: Number, default: 0 }
}, {
    timestamps: false,
    versionKey: false
})

module.exports = mongoose.model('SpecialAccount', SpecialAccount)
