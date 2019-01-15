'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Reward = new Schema({
    epoch: { type: Number, index: true },
    startBlock: { type: Number },
    endBlock: { type: Number },
    address: { type: String, index: true },
    validator: { type: String, index: true },
    validatorName: String,
    reason: { type: String, index: true },
    lockBalance: { type: String },
    reward: { type: String },
    rewardTime: { type: Date },
    signNumber: { type: Number }
}, {
    timestamps: true
})

module.exports = mongoose.model('Reward', Reward)
