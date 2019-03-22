'use strict'

const db = require('../models')
const logger = require('../helpers/logger')
const axios = require('axios')
const config = require('config')
const consumer = {}
consumer.name = 'BlockFinalityProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let blocks = await db.Block.find({ finality: { $lt: 50 }, updateFinalityTime: { $lt: 10 } })
        .sort({ number: -1 }).limit(100)
    logger.info('Update finality %s blocks', blocks.length)
    try {
        let map = blocks.map(async function (block) {
            let data = {
                'jsonrpc': '2.0',
                'method': 'eth_getBlockFinalityByHash',
                'params': [block.hash],
                'id': 88
            }
            const response = await axios.post(config.get('WEB3_URI'), data)
            let result = response.data

            block.finality = parseInt(result.result)
            block.updateFinalityTime = block.updateFinalityTime ? block.updateFinalityTime + 1 : 1
            block.save()
        })
        await Promise.all(map)
        return done()
    } catch (e) {
        logger.warn(e)
        return done(e)
    }
}

module.exports = consumer
