'use strict'

const AccountHelper = require('../helpers/account')

const consumer = {}
consumer.name = 'AccountProcess'
consumer.processNumber = 6
consumer.task = async function (job, done) {
    let hash = job.data.address.toLowerCase()
    console.log('Process account: ', hash)

    try {
        await AccountHelper.processAccount(hash)
    } catch (e) {
        return done(e)
    }

    return done()
}

module.exports = consumer
