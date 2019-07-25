'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const TxExtraInfo = new Schema({
    transactionHash: { type: String, index: true },
    infoName: String,
    infoValue: String
}, {
    timestamps: false
})

module.exports = mongoose.model('TxExtraInfo', TxExtraInfo)
