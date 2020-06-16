'use strict'

const logger = require('./helpers/logger')
const Queue = require('./queues')
const path = require('path')
const fs = require('fs')

// fix warning max listener
process.setMaxListeners(1000)

fs.readdirSync(path.join(__dirname, 'queues'))
    .filter(function (file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.indexOf('.map') < 0)
    })
    .forEach(async function (file) {
        const consumer = require(path.join(__dirname, 'queues', file))
        const { ch } = await Queue.channel()

        await ch.prefetch(1)
        logger.info(' [*] Waiting for messages in %s. To exit press CTRL+C', consumer.name)
        ch.consume(consumer.name, async function (msg) {
            const content = msg.content.toString()
            consumer.task(JSON.parse(content))
            ch.ack(msg)
        }, {
            noAck: false
        })
        // await ch.close()
        // await conn.close()
        // q.process(consumer.name, consumer.processNumber, consumer.task)
    })
