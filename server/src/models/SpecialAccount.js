'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const SpecialAccount = new Schema({
    hash: { type: String, unique: true, index: true },
    total: { type: Number, default: 0 },
    pending: { type: Number, default: 0 },
    sign: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
})

module.exports = mongoose.model('SpecialAccount', SpecialAccount)
