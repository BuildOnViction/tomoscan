const EventEmitter = require('events').EventEmitter
const emitter = new EventEmitter()

emitter.on('error', e => {
    console.error('ERROR!!!', e)
    process.exit(1)
})

module.exports = emitter
