'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const InternalTx = new Schema({
    hash: { type: String, index: true },
    from: { type: String, index: true },
    to: { type: String, index: true },
    blockNumber: Number,
    blockHash: { type: String, index: true },
    value: String,
    timestamp: Date
}, {
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false
})
InternalTx.index({ blockNumber: -1 })

module.exports = mongoose.model('InternalTx', InternalTx)
