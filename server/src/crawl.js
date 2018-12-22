'use strict'

const kue = require('kue')
const config = require('config')
const path = require('path')
const fs = require('fs')

// fix warning max listener
process.setMaxListeners(1000)

const q = kue.createQueue({
    prefix: config.get('redis.prefix'),
    redis: {
        port: config.get('redis.port'),
        host: config.get('redis.host'),
        auth: config.get('redis.password'),
        'socket_keepalive': true
    }
})
q.setMaxListeners(1000)
q.watchStuckJobs()

fs.readdirSync(path.join(__dirname, 'queues'))
    .filter(function (file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.indexOf('.map') < 0)
    })
    .forEach(function (file) {
        let consumer = require(path.join(__dirname, 'queues', file))

        q.process(consumer.name, consumer.processNumber, consumer.task)
    })


module.exports = q
