'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Signature = new Schema({
    signedAddress: { type: String, unique: true, index: true },
    signedAddressId: { type: String, index: true },
    message: String,
    signature: String
}, {
    timestamps: true,
    versionKey: false
})

Signature.index({ createdAt: 1 }, { expires: '3600s' })
module.exports = mongoose.model('Signature', Signature)
