'use strict'

const config = require('config')
const db = require('../models')

const consumer = {}
consumer.name = 'UserVoteProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let startBlock = job.data.startBlock
    let endBlock = job.data.endBlock
    let histories = await db.VoteHistory.find({
        blockNumber: {$gte: startBlock, $lte: endBlock}
    }).sort({blockNumber: 1})

    console.log('There are %s histories', histories.length)
    for (let i = 0; i < histories.length; i++) {
        let history = histories[i]
        console.log('process item %s event %s, voter %s, amount %s', i, history.event, history.voter, history.cap)

        if (history.event === 'Propose') {
            let data = {
                voter: history.owner,
                candidate: history.candidate,
                epoch: Math.ceil(history.blockNumber/900),
                voteAmount: history.cap
            }
            await db.UserVoteAmount.create(data)
        } else if (history.event === 'Vote') {
            let h = await db.UserVoteAmount.findOne({
                voter: history.voter,
                candidate: history.candidate
            }).sort({epoch: -1})
            await db.UserVoteAmount.findOneAndUpdate({
                voter: history.voter,
                candidate: history.candidate,
                epoch: Math.floor(history.blockNumber/900)
            }, {
                voteAmount: (h ? h.voteAmount : 0) + history.cap
            }, { upsert: true, new: true })

        } else if (history.event === 'Unvote') {
            let h = await db.UserVoteAmount.findOne({
                voter: history.voter,
                candidate: history.candidate
            }).sort({epoch: -1})
            await db.UserVoteAmount.updateOne({
                voter: history.voter,
                candidate: history.candidate,
                epoch: Math.floor(history.blockNumber/900)
            }, {
                voteAmount: (h ? h.voteAmount : 0) - history.cap
            }, { upsert: true, new: true })

        } else if (history.event === 'Resign') {
            let h = await db.UserVoteAmount.findOne({
                voter: history.voter,
                candidate: history.candidate
            }).sort({epoch: -1})
            await db.UserVoteAmount.updateOne({
                voter: history.voter,
                candidate: history.candidate,
                epoch: Math.ceil(history.blockNumber/900)
            }, {
                voteAmount: (h ? h.voteAmount : 0) - history.cap
            }, { upsert: true, new: true })
        }
    }

    console.log('Duplicate vote amount')
    let lastRow = await db.UserVoteAmount.findOne().sort({epoch: -1})
    if (lastRow) {
        let lastEpoch = lastRow.epoch
        for (let i = 0; i<= lastEpoch; i++) {
            let voteInEpoch = await db.UserVoteAmount.find({epoch: i})
            let data = []
            for (let j = 0; j < voteInEpoch.length; j++) {
                if (i < lastEpoch) {
                    let nextEpoch = await db.UserVoteAmount.findOne({
                        voter: voteInEpoch[j].voter,
                        epoch: voteInEpoch[j].epoch + 1,
                        candidate: voteInEpoch[j].candidate
                    })
                    if (!nextEpoch) {
                        data.push({
                            voter: voteInEpoch[j].voter,
                            epoch: voteInEpoch[j].epoch + 1,
                            voteAmount: voteInEpoch[j].voteAmount,
                            candidate: voteInEpoch[j].candidate
                        })
                    }
                }

            }
            if (data.length > 0) {
                console.log('Process epoch %s to duplicate in epoch %s', i, i + 1)
                await db.UserVoteAmount.insertMany(data)
            }
        }
    }

}

module.exports = consumer
