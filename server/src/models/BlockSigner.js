'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var BlockSigner = new Schema({
    blockNumber: {
        type: Number,
        index: true
    },
    blockHash: {
        type: String,
        index: true
    },
    signers: [
        {
            type: String,
            index: true
        }
    ]

}, { timestamps: true })

module.exports = mongoose.model('BlockSigner', BlockSigner)
