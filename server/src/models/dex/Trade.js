'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Trade = new Schema({
    taker: { type: String, index: true },
    maker: { type: String, index: true },
    baseToken: { type: String, index: true },
    quoteToken: { type: String, index: true },
    txHash: { type: String, index: true },

    pairName: String,
    amount: String,
    pricepoint: String,
    status: { type: String, index: true }
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model('Trade', Trade)
