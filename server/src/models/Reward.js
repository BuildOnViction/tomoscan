'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Reward = new Schema({
    epoch: { type: Number, index: true },
    startBlock: { type: Number },
    endBlock: { type: Number },
    address: { type: String, index: true },
    isMasterNode: { type: Boolean, index: true },
    lockBalance: { type: Number },
    reward: { type: Number },
    numberBlockSigner: { type: Number }
}, {
    timestamps: true
})

module.exports = mongoose.model('Reward', Reward)
