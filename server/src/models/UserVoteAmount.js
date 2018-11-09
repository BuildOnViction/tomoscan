'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const UserVoteAmount = new Schema({
    voter: { type: String, index: true },
    candidate: { type: String, index: true },
    epoch: { type: Number, index: true },
    voteAmount: Number
}, {
    timestamps: true
})

module.exports = mongoose.model('UserVoteAmount', UserVoteAmount)
