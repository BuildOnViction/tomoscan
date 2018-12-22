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

module.exports = q
