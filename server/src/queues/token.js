const TokenHelper = require('../helpers/token')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'TokenProcess'
consumer.processNumber = 1
consumer.task = async function (job) {
    const address = job.address.toLowerCase()
    logger.info('Process token: %s', address)
    try {
        await TokenHelper.updateTokenInfo(address)
    } catch (e) {
        logger.warn('cannot process token %s. Error %s', address, e)
        return false
    }

    return true
}

module.exports = consumer
