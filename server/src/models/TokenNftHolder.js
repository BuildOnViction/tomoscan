'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TokenNftHolder = new Schema({
    holder: { type: String, index: true },
    token: { type: String, index: true },
    tokenId: { type: Number, index: true }
}, {
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false
})

module.exports = mongoose.model('TokenNftHolder', TokenNftHolder)
