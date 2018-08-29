'use strict'

import BlockHelper from '../helpers/block'
const config = require('config')

const consumer = {}
consumer.name = 'BlockProcess'
consumer.processNumber = 2
consumer.task = async function (job, done) {
    let blockNumber = job.data.block
    console.log('Process block: ', blockNumber)
    await BlockHelper.crawlBlock(blockNumber)

    if (parseInt(blockNumber) % config.get('BLOCK_PER_EPOCH') === 0) {
        const q = require('./index')
        let epoch = parseInt(blockNumber) / config.get('BLOCK_PER_EPOCH')
        q.create('VoterProcess', { epoch: epoch })
            .priority('critical').removeOnComplete(true).save()
    }

    done()
}

module.exports = consumer
