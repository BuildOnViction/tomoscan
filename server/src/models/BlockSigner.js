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
    finality: { type: Boolean, default: false },

}, { timestamps: true })

module.exports = mongoose.model('BlockSigner', BlockSigner)
