'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TokenInfo = new Schema({
    hash: { type: String, unique: true, required: true, index: true },
    website: String,
    communities: [{
        name: String,
        icon: String,
        url: String,
        title: String
    }],
    overview: String,
    icoInfo: String,
    status: { type: Boolean, default: false }
}, {
    timestamps: false
})

module.exports = mongoose.model('TokenInfo', TokenInfo)
