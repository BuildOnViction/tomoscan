'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Contract = new Schema({
    hash: { type: String, index: true },
    contractName: { type: String },
    compiler: { type: String },
    sourceCode: String,
    abiCode: String,
    functionHashes: {},
    opcodes: String,
    bytecode: String,
    code: String,
    balance: String,
    balanceNumber: Number,
    optimization: Boolean,
    txCount: Number
}, {
    timestamps: true,
    versionKey: false
})

module.exports = mongoose.model('Contract', Contract)
