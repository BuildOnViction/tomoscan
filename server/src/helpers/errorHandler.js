const EventEmitter = require('events').EventEmitter
const emitter = new EventEmitter()
const q = require('../queues')

emitter.on('error', (e, blockNumber) => {
    console.error('ERROR!!!', blockNumber, e)
    console.log('Re-crawl blockNumber', blockNumber)
    q.create('BlockProcess', { block: blockNumber })
        .priority('high').removeOnComplete(true).save()

})

module.exports = emitter
