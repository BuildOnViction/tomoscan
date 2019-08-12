'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Token = new Schema({
    hash: { type: String, unique: true, required: true, index: true },
    owner: { type: String, index: true },
    name: String,
    totalSupply: String,
    totalSupplyNumber: { type: Number, index: true },
    symbol: String,
    decimals: Number,
    txCount: { type: Number, default: 0 },
    status: { type: Boolean, default: false },
    type: { type: String, index: true },
    isMintable: { type: Boolean, index: true }
}, {
    timestamps: true,
    toJSON: { virtuals: true, getters: true },
    toObject: { virtuals: true, getters: true },
    versionKey: false
})

module.exports = mongoose.model('Token', Token)
