'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ContractEvent = new Schema({
    address: { type: String, index: true },
    blockNumber: { type: Number, index: true },
    transactionHash: { type: String, index: true },
    transactionIndex: Number,
    blockHash: { type: String, index: true },
    logIndex: Number,
    removed: Boolean,
    id: String,
    returnValues: {},
    event: String,
    signature: String,
    raw: {},
    functionHash: String,
    functionName: String
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model('ContractEvent', ContractEvent)
