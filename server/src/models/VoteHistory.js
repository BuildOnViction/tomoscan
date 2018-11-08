'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const VoteHistory = new Schema({
    txHash: { type: String, index: true },
    blockNumber: { type: Number, index: true },
    event: { type: String, index: true },
    blockHash: String,
    voter: { type: String, index: true },
    owner: { type: String, index: true },
    candidate: { type: String, index: true },
    cap: Number
}, {
    timestamps: true
})

module.exports = mongoose.model('VoteHistory', VoteHistory)
