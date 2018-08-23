'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Block = new Schema({
    number: { type: Number, unique: true, index: true },
    hash: { type: String, index: true },
    parentHash: String,
    nonce: String,
    sha3Uncles: String,
    logsBloom: String,
    transactionsRoot: String,
    stateRoot: String,
    receiptsRoot: String,
    miner: String,
    difficulty: String,
    totalDifficulty: String,
    extraData: String,
    size: Number,
    gasLimit: Number,
    gasUsed: Number,
    timestamp: Date,
    uncles: Array,
    signer: String,
    status: { type: Boolean, default: false, index: true },
    finality: { type: Number, default: 0 },
    e_tx: { type: Number, default: 0 }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
})

module.exports = mongoose.model('Block', Block)
