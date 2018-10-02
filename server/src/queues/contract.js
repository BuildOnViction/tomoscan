'use strict'

const db = require('../models')

const consumer = {}
consumer.name = 'ContractProcess'
consumer.processNumber = 6
consumer.task = async function (job, done) {
    let address = job.data.address.toLowerCase()
    console.log('Process contract: ', address)

    await db.Contract.update({ hash: address }, { $inc: { txCount: 1 } })
    done()
}

module.exports = consumer
