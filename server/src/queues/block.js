'use strict'

import BlockHelper from '../helpers/block'
const db = require('../models')
const config = require('config')

const consumer = {}
consumer.name = 'BlockProcess'
consumer.processNumber = 1
consumer.task = async function(job, done) {
    let blockNumber = job.data.block
    console.log('Process block: ', blockNumber)
    await BlockHelper.processBlock(blockNumber)
    const q = require('./index')

    if (parseInt(blockNumber) % config.get('BLOCK_PER_EPOCH') === config.get('BLOCK_CALCULATE_VOTER')) {
        let epoch = Math.trunc(parseInt(blockNumber) / config.get('BLOCK_PER_EPOCH')) + 1
        await q.create('VoterProcess', {epoch: epoch})
            .priority('critical').removeOnComplete(true).save()
    }

    if (parseInt(blockNumber) % config.get('BLOCK_PER_EPOCH') === 0) {
        let epoch = parseInt(blockNumber)/config.get('BLOCK_PER_EPOCH')
        if (epoch > 1) {
            await q.create('RewardValidatorProcess', {epoch: epoch - 1})
                .priority('critical').removeOnComplete(true).save()
        }
    }

    done()
}

module.exports = consumer
