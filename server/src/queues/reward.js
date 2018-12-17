'use strict'
const RewardHelper = require('../helpers/reward')

const consumer = {}
consumer.name = 'RewardProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let epoch = parseInt(job.data.epoch)
    await RewardHelper.rewardProcess(epoch)
    return done()
}

module.exports = consumer
