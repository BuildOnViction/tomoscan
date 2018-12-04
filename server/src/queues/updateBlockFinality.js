'use strict'

const db = require('../models')
const Web3 = require('../helpers/web3')

const consumer = {}
consumer.name = 'BlockFinalityProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let web3 = await Web3.getWeb3()
    let blocks = await db.Block.find({ finality: { $lt: 50 }, updateFinalityTime: { $lt: 10 } })
        .sort({ number: -1 }).limit(500)
    console.info('Update finality %s blocks', blocks.length, (blocks[0] || {}).number)
    try {
        let map = blocks.map(async function (block) {
            let b = await web3.eth.getBlock(block.number)
            block.finality = b.hasOwnProperty('finality') ? parseInt(b.finality) : 0
            block.updateFinalityTime = block.updateFinalityTime ? block.updateFinalityTime + 1 : 1
            block.save()
        })
        await Promise.all(map)
        done()
    } catch (e) {
        console.error(e)
        done(e)
    }
}

module.exports = consumer
