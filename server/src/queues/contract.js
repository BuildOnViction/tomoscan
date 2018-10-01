'use strict'

const db = require('../models')

const consumer = {}
consumer.name = 'ContractProcess'
consumer.processNumber = 6
consumer.task = async function (job, done) {
    let address = job.data.address.toLowerCase()
    console.log('Process contract: ', address)

    let fromCount = await db.Tx.countDocuments({ from: address })
    let toCount = await db.Tx.countDocuments({ to: address })
    let contractCount = await db.Tx.countDocuments({ contractAddress: address })
    let fromToCount = await db.Tx.countDocuments({ from: address, to: address })
    let txCount = fromCount + toCount + contractCount - fromToCount

    await db.Contract.findOneAndUpdate({hash: address}, {txCount: txCount})
    done()
}

module.exports = consumer
