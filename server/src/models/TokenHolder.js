'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TokenHolder = new Schema({
    hash: String,
    token: String,
    quantity: String,
    quantityNumber: Number
}, {
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false
})

module.exports = mongoose.model('TokenHolder', TokenHolder)
