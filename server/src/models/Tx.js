'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Tx = new Schema({
    hash: { type: String, unique: true, required: true },
    nonce: { type: Number },
    blockHash: { index: true, type: String },
    blockNumber: { type: Number, index: true },
    transactionHash: { type: String, index: true },
    transactionIndex: Number,
    from: { type: String, index: true },
    to: { type: String, index: true },
    value: String,
    gas: Number,
    gasPrice: String,
    input: String,
    contractAddress: { type: String, index: true },
    cumulativeGasUsed: Number,
    gasUsed: Number,
    block: { type: Schema.Types.ObjectId, ref: 'Block' },
    from_model: { accountName: String, isContract: Boolean, contractCreation: String },
    to_model: { accountName: String, isContract: Boolean, contractCreation: String },
    status: { type: Boolean, default: false },
    isPending: { type: Boolean, index: true, default: false },
    timestamp: Date,
    i_tx: { type: Number, default: 0 }
}, {
    timestamps: true,
    toObject: { virtuals: true, getters: true },
    toJSON: { virtuals: true, getters: true },
    versionKey: false
})
Tx.index({ blockNumber: -1 })
Tx.index({ createdAt: -1 })

module.exports = mongoose.model('Tx', Tx)
