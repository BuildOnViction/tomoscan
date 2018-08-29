'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Tx = new Schema({
    hash: { type: String, unique: true, required: true },
    nonce: {
        type: Number,
        index: true
    },
    blockHash: {
        index: true,
        type: String
    },
    blockNumber: {
        index: true,
        type: Number
    },
    transactionHash: {
        type: String,
        index: true
    },
    transactionIndex: Number,
    from: {
        type: String,
        index: true
    },
    to: {
        type: String,
        index: true
    },
    value: String,
    gas: Number,
    gasPrice: String,
    input: String,
    contractAddress: String,
    cumulativeGasUsed: Number,
    gasUsed: Number,
    block: { type: Schema.Types.ObjectId, ref: 'Block' },
    from_model: { type: Schema.Types.ObjectId, ref: 'Account' },
    to_model: { type: Schema.Types.ObjectId, ref: 'Account' },
    status: { type: Boolean, default: false },
    timestamp: Date,
}, {
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false
})

module.exports = mongoose.model('Tx', Tx)
