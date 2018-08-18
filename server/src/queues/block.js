'use strict'

import BlockHelper from '../helpers/block'
const config = require('config')

const consumer = {}
consumer.name = 'BlockProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let blockNumber = job.data.block
    console.log('Process block: ', blockNumber)
    await BlockHelper.processBlock(blockNumber)
    const q = require('./index')

    if (parseInt(blockNumber) % config.get('BLOCK_PER_EPOCH') === 0) {
        let epoch = parseInt(blockNumber) / config.get('BLOCK_PER_EPOCH')
        await q.create('VoterProcess', { epoch: epoch })
            .priority('critical').removeOnComplete(true).save()
    }

    done()
}

module.exports = consumer
