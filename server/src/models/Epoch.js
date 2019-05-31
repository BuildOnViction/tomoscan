'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Epoch = new Schema({
    epoch: { type: Number, unique: true },
    startBlock: Number,
    endBlock: Number,
    startTime: Date,
    endTime: Date,
    duration: Number,
    masterNodeNumber: Number,
    voterNumber: Number,
    slashedNode: [{ type: String }],
    isActive: Boolean
}, {
    timestamps: false,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
})

Epoch.index({ epoch: -1 })
module.exports = mongoose.model('Epoch', Epoch)
