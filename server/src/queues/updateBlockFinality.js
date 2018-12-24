'use strict'

const db = require('../models')
const logger = require('../helpers/logger')
const BlockHelper = require('../helpers/block')

const consumer = {}
consumer.name = 'BlockFinalityProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let blocks = await db.Block.find({ finality: { $lt: 50 }, updateFinalityTime: { $lt: 10 } })
        .sort({ number: -1 }).limit(100)
    logger.info('Update finality %s blocks', blocks.length)
    try {
        let map = blocks.map(async function (block) {
            let b = await BlockHelper.getBlock(block.number)
            block.finality = b.hasOwnProperty('finality') ? parseInt(b.finality) : 0
            block.updateFinalityTime = block.updateFinalityTime ? block.updateFinalityTime + 1 : 1
            block.save()
        })
        await Promise.all(map)
        done()
    } catch (e) {
        logger.warn(e)
        done(e)
    }
}

module.exports = consumer
