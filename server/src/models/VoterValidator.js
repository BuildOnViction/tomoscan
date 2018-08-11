'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const VoterValidator = new Schema({
    epoch: { type: Number },
    fromBlock: { type: Number },
    toBlock: { type: Number },
    masterNode: { type: String },
    balance: { type: Number }
}, {
    timestamps: true,
})

module.exports = mongoose.model('VoterValidator', VoterValidator)

