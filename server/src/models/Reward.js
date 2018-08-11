'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Reward = new Schema({
    epoch: { type: Number },
    totalReward: { type: Number },
    fromBlock: { type: Number },
    toBlock: { type: Number },
    reward: {
        masterNode: [
            {
                address: { type: String },
                numberBlockSigner: { type: Number },
                lockBalance: { type: Number },
                reward: { type: Number }
            }
        ],
        voter: [
            {
                address: { type: String },
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

