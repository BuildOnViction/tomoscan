'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ContractEvent = new Schema({
    address: String,
    blockNumber: Number,
    transactionHash: String,
    transactionIndex: Number,
    blockHash: String,
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
