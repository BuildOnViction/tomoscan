'use strict'

const config = require('config')
const db = require('../models')

const consumer = {}
consumer.name = 'UserVoteProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let epoch = job.data.epoch
    let endBlock = parseInt(epoch) * config.get('BLOCK_PER_EPOCH')
    let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1

    let histories = await db.VoteHistory.find({
        blockNumber: { $gte: startBlock, $lte: endBlock }
    }).sort({ blockNumber: 1 })

    console.info('There are %s histories in epoch %s', histories.length, epoch)
    for (let i = 0; i < histories.length; i++) {
        let history = histories[i]

        if (history.event === 'Propose') {
            let data = {
                voter: history.owner,
                candidate: history.candidate,
                epoch: Math.ceil(history.blockNumber / 900),
                voteAmount: history.cap
            }
            await db.UserVoteAmount.create(data)
        } else if (history.event === 'Vote') {
            let h = await db.UserVoteAmount.findOne({
                voter: history.voter,
                candidate: history.candidate
            }).sort({ epoch: -1 })
            await db.UserVoteAmount.updateOne({
                voter: history.voter,
                candidate: history.candidate,
                epoch: Math.floor(history.blockNumber / 900)
            }, {
                voteAmount: (h ? h.voteAmount : 0) + history.cap
            }, { upsert: true, new: true })
        } else if (history.event === 'Unvote') {
            let h = await db.UserVoteAmount.findOne({
                voter: history.voter,
                candidate: history.candidate
            }).sort({ epoch: -1 })
            await db.UserVoteAmount.updateOne({
                voter: history.voter,
                candidate: history.candidate,
                epoch: Math.floor(history.blockNumber / 900)
            }, {
                voteAmount: (h ? h.voteAmount : 0) - history.cap
            }, { upsert: true, new: true })
        } else if (history.event === 'Resign') {
            let h = await db.UserVoteAmount.findOne({
                voter: history.voter,
                candidate: history.candidate
            }).sort({ epoch: -1 })
            await db.UserVoteAmount.updateOne({
                voter: history.voter,
                candidate: history.candidate,
                epoch: Math.ceil(history.blockNumber / 900)
            }, {
                voteAmount: (h ? h.voteAmount : 0) - history.cap
            }, { upsert: true, new: true })
        }
    }

    console.info('Duplicate vote amount')
    // Find in history and duplicate to this epoch if not found
    let voteInEpoch = await db.UserVoteAmount.find({ epoch: epoch - 1 })
    let data = []
    for (let j = 0; j < voteInEpoch.length; j++) {
        let nextEpoch = await db.UserVoteAmount.findOne({
            voter: voteInEpoch[j].voter,
            epoch: epoch,
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
    if (data.length > 0) {
        console.info('Duplicate data to epoch %s', epoch)
        await db.UserVoteAmount.insertMany(data)
    }

    const q = require('./index')
    q.create('RewardValidatorProcess', { epoch: epoch })
        .priority('normal').removeOnComplete(true)
        .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
    done()
}

module.exports = consumer
