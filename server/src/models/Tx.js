'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Tx = new Schema({
    hash: { type: String, unique: true, required: true },
    nonce: Number,
    blockHash: String,
    blockNumber: Number,
    transactionHash: String,
    transactionIndex: Number,
    from: String,
    to: String,
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
    status: { type: Boolean, default: false }
}, {
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false
})

module.exports = mongoose.model('Tx', Tx)
