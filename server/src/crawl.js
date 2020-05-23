'use strict'

const logger = require('./helpers/logger')
const path = require('path')
const fs = require('fs')

// fix warning max listener
process.setMaxListeners(1000)

const amqp = require('amqplib')

fs.readdirSync(path.join(__dirname, 'queues'))
    .filter(function (file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.indexOf('.map') < 0)
    })
    .forEach(function (file) {
        const consumer = require(path.join(__dirname, 'queues', file))

        amqp.connect('amqp://localhost', function (error0, connection) {
            if (error0) {
                logger.warn(error0)
            }
            connection.createChannel(function (error1, channel) {
                if (error1) {
                    logger.warn(error1)
                }
                channel.assertQueue(consumer.name, {
                    durable: true
                })
                channel.prefetch(1)
                console.log(' [*] Waiting for messages in %s. To exit press CTRL+C', consumer.name)
                channel.consume(consumer.name, async function (msg) {
                    await consumer.task(msg)
                    console.log(' [x] Received %s', msg.content.toString())
                    channel.ack(msg)
                }, {
                    noAck: false
                })
            })
        })
        // q.process(consumer.name, consumer.processNumber, consumer.task)
    })
