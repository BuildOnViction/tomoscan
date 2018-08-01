'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Log = new Schema({
    address: String,
    blockNumber: Number,
    blockHash: String,
    data: String,
    id: String,
    logIndex: Number,
    removed: Boolean,
    topics: {},
    transactionHash: String,
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
