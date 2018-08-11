'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Reward = new Schema({
    epoch: { type: Number, index: true },
    totalReward: { type: Number },
    fromBlock: { type: Number },
    toBlock: { type: Number },
    reward: {
        masterNode: [
            {
                address: { type: String, index: true },
                numberBlockSigner: { type: Number },
                lockBalance: { type: Number },
                reward: { type: Number }
            }
        ],
        voter: [
            {
                address: { type: String, index: true },
                masterNode: { type: String },
                voteBalance: { type: Number },
                reward: { type: Number }
            }
        ]
    }
}, {
    timestamps: true,
})

module.exports = mongoose.model('Reward', Reward)

