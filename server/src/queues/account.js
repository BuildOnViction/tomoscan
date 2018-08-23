'use strict'

import AccountHelper from '../helpers/account'

const consumer = {}
consumer.name = 'AccountProcess'
consumer.processNumber = 12
consumer.task = async function (job, done) {
    let hash = job.data.address.toLowerCase()
    console.log('Process account: ', hash)

    await AccountHelper.processAccountInQueue(hash)

    done()
}

module.exports = consumer
