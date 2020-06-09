const redis = require('../redis')

const JOBNAME = 'JobCount'
const QueueHelper = {
    countJob: async () => {
        const count = redis.get(JOBNAME)
        if (count) {
            return parseInt(count)
        }
        return 0
    },
    newJob: async () => {
        await redis.set(JOBNAME, await QueueHelper.countJob() + 1)
    },
    reduceJob: async () => {
        await redis.set(JOBNAME, await QueueHelper.countJob() - 1)
    }
}

module.exports = QueueHelper
