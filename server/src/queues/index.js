const amqp = require('amqplib')

const rabitmqSettings = {
    protocol: 'amqp',
    hostname: 'localhost',
    port: 5672,
    // username: 'admin',
    // password: 'admin@123',
    authMechanism: ['PLAIN', 'AMQPLAIN', 'EXTERNAL']
}

const Queue = {
    connection: async () => {
        return amqp.connect(rabitmqSettings)
    },
    channel: async () => {
        const conn = await Queue.connection()
        return conn.createChannel()
    },
    newQueue: async (queueName, data) => {
        const channel = await Queue.channel()
        channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
            persistent: true
        })
    },

    countJob: async () => {
        const ch = await Queue.channel()
        const count = await ch.assertQueue('BlockProcess', { durable: false })
        return count.messageCount
    }
}

module.exports = Queue
