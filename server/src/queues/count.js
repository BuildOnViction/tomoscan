const logger = require('../helpers/logger')
const db = require('../models')

const consumer = {}
consumer.name = 'CountProcess'
consumer.processNumber = 16
consumer.task = async function (job, done) {
    try {
        let data = JSON.parse(job.data.data)
        logger.info('count process %s items', data.length)
        for (let i = 0; i < data.length; i++) {
            let item = data[i]
            let hash = item.hash
            let countType = item.countType
            switch (countType) {
            case 'mined':
                await db.Account.updateOne({ hash: hash }, { $inc : { minedBlock: 1 } }, { upsert: true })
                break
            case 'inTx':
                await db.Account.updateOne({ hash: hash },
                    { $inc : { inTxCount: 1, totalTxCount: 1 } }, { upsert: true })
                break
            case 'outTx':
                await db.Account.updateOne({ hash: hash },
                    { $inc : { outTxCount: 1, totalTxCount: 1 } }, { upsert: true })
                break
            case 'internalTx':
                await db.Account.updateOne({ hash: hash }, { $inc : { internalTxCount: 1 } }, { upsert: true })
                break
            case 'reward':
                await db.Account.updateOne({ hash: hash }, { $inc : { rewardCount: 1 } }, { upsert: true })
                break
            case 'log':
                await db.Account.updateOne({ hash: hash }, { $inc : { logCount: 1 } }, { upsert: true })
                break
            case 'tokenTx':
                await db.Account.updateOne({ hash: hash }, { $inc : { tokenTxCount: 1 } }, { upsert: true })
                break
            default:
                break
            }
        }

        return done()
    } catch (e) {
        logger.warn('CountProcess error %s', e)
        return done(e)
    }
}

module.exports = consumer
