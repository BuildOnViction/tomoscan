const EventEmitter = require('events').EventEmitter
const emitter = new EventEmitter()

emitter.on('errorCrawlBlock', (e, blockNumber) => {
    console.error('ERROR!!!', blockNumber, e)
    console.log('Re-crawl blockNumber', blockNumber)
    const q = require('../queues')
    q.create('BlockProcess', { block: blockNumber })
        .priority('critical').removeOnComplete(true).save()
})

module.exports = emitter
