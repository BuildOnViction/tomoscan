const logger = require('../helpers/logger')
const QueueHelper = require('../helpers/queue')
const amqp = require('amqplib')

// fix warning max listener
process.setMaxListeners(1000)

const publishToQueue = async (queueName, data) => {
    var rabitmqSettings = {
        protocol: 'amqp',
        hostname: 'localhost',
        port: 5672
        // username: 'admin',
        // password: 'admin@123',
        // authMechanism: ['PLAIN', 'AMQPLAIN', 'EXTERNAL']
    }
    amqp.connect(rabitmqSettings).then(function (error0, conn) {
        if (error0) {
            console.warn('error0', error0)
        }
        return conn.createChannel().then(async function (error1, ch) {
            if (error1) {
                console.warn('error1', error1)
            }
            ch.assertQueue(queueName, { durable: false })
            ch.sendToQueue(queueName, Buffer.from(data), {
                persistent: true
            })
            await QueueHelper.newJob()
            return ch.close()
        }).finally(function () { conn.close() })
    }).catch(e => {
        logger.warn(e)
    })
}

module.exports = publishToQueue

// const logger = require('../helpers/logger')
// const amqp = require('amqplib')
//
// // fix warning max listener
// process.setMaxListeners(1000)
//
// const publishToQueue = async (queueName, data) => {
//     amqp.connect('amqp://localhost').then(function (error0, conn) {
//         if (error0) {
//             logger.warn(error0)
//         }
//         return conn.createChannel().then(function (error1, ch) {
//             if (error1) {
//                 logger.warn(error1)
//             }
//             ch.assertQueue(queueName, { durable: false })
//             ch.sendToQueue(queueName, Buffer.from(data), {
//                 persistent: true
//             })
//             return ch.close()
//         }).finally(function () { conn.close() })
//     }).catch(e => {
//         logger.warn(e)
//     })
// }
//
// module.exports = publishToQueue
