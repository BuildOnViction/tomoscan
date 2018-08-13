'use strict'

const db = require('../models')


const consumer = {}
consumer.name = 'AddRewardToAccount'
consumer.processNumber = 6
consumer.task = async function(job, done) {
    let address = job.data.address
    let balance = job.data.balance

    await db.Account.findOneAndUpdate({hash: address}, {$inc: {balance: balance}})

    done()

}

module.exports = consumer
