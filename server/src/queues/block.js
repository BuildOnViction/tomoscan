'use strict'

import BlockHelper from '../helpers/block'
const db = require('../models')

const consumer = {}
consumer.name = 'BlockProcess'
consumer.processNumber = 1
consumer.task = async function(job, done) {
    let blockNumber = job.data.block
    console.log('Process block: ', blockNumber)
    await BlockHelper.processBlock(blockNumber)

    done()
}

module.exports = consumer
