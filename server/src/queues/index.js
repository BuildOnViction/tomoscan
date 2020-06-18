const amqp = require('amqplib')
const config = require('config')

const rabitmqSettings = {
    protocol: 'amqp',
    hostname: config.get('rabbitmq.hostname'),
    port: config.get('rabbitmq.port'),
    username: config.get('rabbitmq.username'),
    password: config.get('rabbitmq.password'),
    authMechanism: ['PLAIN', 'AMQPLAIN', 'EXTERNAL']
}

const Queue = {
    channel: async () => {
        const conn = await amqp.connect(rabitmqSettings)
        const ch = await conn.createChannel()
        return { conn, ch }
    },
    newQueue: async (queueName, data) => {
        const { conn, ch } = await Queue.channel()
        await ch.sendToQueue(queueName, Buffer.from(JSON.stringify(data), { durable: false }), {
            persistent: true
        })
        await ch.close()
        await conn.close()
    },

    countJob: async (queueName) => {
        const { conn, ch } = await Queue.channel()
        const count = await ch.assertQueue(queueName, { durable: false })
        const num = count.messageCount

        await ch.close()
        await conn.close()
        return num
    }
}

module.exports = Queue
