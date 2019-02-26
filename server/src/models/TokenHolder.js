'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TokenHolder = new Schema({
    hash: { type: String, index: true },
    token: { type: String, index: true },
    tokenDecimals: Number,
    quantity: String,
    quantityNumber: { type: Number, index: true }
}, {
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false
})

module.exports = mongoose.model('TokenHolder', TokenHolder)
