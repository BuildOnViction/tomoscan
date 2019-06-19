'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TokenNftTx = new Schema({
    address: { type: String, index: true },
    blockHash: { type: String, index: true },
    blockNumber: { type: Number, index: true },
    transactionHash: { type: String, index: true },
    transactionIndex: Number,
    from: { type: String, index: true },
    to: { type: String, index: true },
    data: String,
    tokenId: { type: Number, index: true }
}, {
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false
})

module.exports = mongoose.model('TokenNftTx', TokenNftTx)
