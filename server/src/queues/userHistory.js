const RewardHelper = require('../helpers/reward')

const consumer = {}
consumer.name = 'UserHistoryProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let epoch = job.data.epoch
    RewardHelper.updateVoteHistory(epoch, true, done)
}

module.exports = consumer
