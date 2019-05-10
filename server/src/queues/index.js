'use strict'

const kue = require('kue')
const config = require('config')
const logger = require('../helpers/logger')
const Redis = require('ioredis')

// fix warning max listener
process.setMaxListeners(1000)

const q = kue.createQueue({
    prefix: config.get('redis.prefix'),
    redis: {
        createClientFactory: function () {
            return new Redis({
                port: config.get('redis.port'),
                host: config.get('redis.host'),
                password: config.get('redis.password')
            })
        }
    }
    // redis: {
    //     port: config.get('redis.port'),
    //     host: config.get('redis.host'),
    //     auth: config.get('redis.password'),
    //     'socket_keepalive': true
    // }
})
q.setMaxListeners(1000)
q.watchStuckJobs()

q.on('error', function (err) {
    logger.error('REDIS-KUE ERROR %s', err)
})

module.exports = q
