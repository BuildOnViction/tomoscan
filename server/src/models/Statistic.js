'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Statistic = new Schema({
    date: { type: Date, unique: true, index: true },
    fromBlock: { type: Number, index: true },
    toBlock: { type: Number, index: true },
    normalTransaction: Number,
    signTransaction: Number,
    account: Number,
    tradeNumber: Number,
    orderNumber: Number,
    lendingOrder: Number,
    lendingTrade: Number
}, {
    timestamps: false,
    versionKey: false
})

Statistic.index({ balanceNumber: -1 })
module.exports = mongoose.model('Statistic', Statistic)
