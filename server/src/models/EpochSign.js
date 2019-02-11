'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const EpochSign = new Schema({
    epoch: { type: Number, index: true },
    validator: { type: String, index: true },
    signNumber: Number
}, {
    timestamps: true
})

module.exports = mongoose.model('EpochSign', EpochSign)
