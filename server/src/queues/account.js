'use strict'

import AccountHelper from '../helpers/account'

const consumer = {}
consumer.name = 'AccountProcess'
consumer.processNumber = 6
consumer.task = async function (job, done) {
    let hash = job.data.address.toLowerCase()
    console.log('Process account: ', hash)

    await AccountHelper.processAccount(hash, (e) => {
        if (e) {
            console.error(consumer.name, e)
            done(e)
        }
    })

    done()
}

module.exports = consumer
