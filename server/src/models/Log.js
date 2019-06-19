'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Log = new Schema({
    address: { type: String, index: true },
    blockNumber: { type: Number, index: true },
    blockHash: { type: String, index: true },
    data: String,
    id: { type: String, index: true },
    logIndex: Number,
    removed: Boolean,
    topics: {},
    transactionHash: { type: String, index: true },
    transactionIndex: Number
//  returnValues: {},
//  event: String,
//  signature: String,
//  raw: {},
//  functionHash: String,
//  functionName: String,
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model('Log', Log)
