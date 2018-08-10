'use strict'

var mongoose = require('mongoose')
var Schema = mongoose.Schema

var BlockSigner = new Schema({
    blockNumber: {
        type: String,
        index: true
    },
    signers: [
        {
            type: String,
            index: true
        }
    ],
    finality: { type: Number, default: 0 },

}, { timestamps: true })

module.exports = mongoose.model('BlockSigner', BlockSigner)
