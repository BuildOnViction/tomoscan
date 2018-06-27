const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    address: String,
    blockNumber: Number,
    blockHash: String,
    data: String,
    id: String,
    logIndex: Number,
    removed: Boolean,
    topics: {},
    transactionHash: String,
    transactionIndex: Number
//  returnValues: {},
//  event: String,
//  signature: String,
//  raw: {},
//  functionHash: String,
//  functionName: String,
}, {
    timestamps: true,
    versionKey: false
})

let Log = mongoose.model('Log', schema)

export default Log
