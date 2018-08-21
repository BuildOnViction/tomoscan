'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const VoterValidator = new Schema({
    voter: { type: String, index: true },
    epoch: { type: Number, index: true },
    fromBlock: { type: Number },
    toBlock: { type: Number },
    masterNode: { type: String, index: true },
    balance: { type: String }
}, {
    timestamps: true
})

module.exports = mongoose.model('VoterValidator', VoterValidator)
