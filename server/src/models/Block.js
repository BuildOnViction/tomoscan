'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Block = new Schema({
    number: { type: Number, index: true },
    hash: { type: String, unique: true },
    parentHash: { type: String, index: true },
    nonce: { type: String, index: true },
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
    signer: { type: String, index: true },
    m2: { type: String, index: true },
    status: { type: Boolean, default: false, index: true },
    finality: { type: Number, default: 0, index: true },
    updateFinalityTime: { type: Number, index: true },
    e_tx: { type: Number, default: 0 }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
})

module.exports = mongoose.model('Block', Block)
