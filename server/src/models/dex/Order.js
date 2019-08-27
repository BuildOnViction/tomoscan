'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Order = new Schema({
    exchangeAddress: { type: String, index: true },
    baseToken: { type: String, index: true },
    quoteToken: { type: String, index: true },
    userAddress: { type: String, index: true },

    status: { type: String, index: true },
    side: { type: String, index: true },
    type: { type: String, index: true },

    quantity: String,
    price: String,
    filledAmount: String,
    makeFee: String,
    takeFee: String,
    pairName: String
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model('Order', Order)
