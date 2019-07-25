const { createLogger, format, transports } = require('winston')
const { combine, printf, timestamp } = format
const config = require('config')

const lFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level.toUpperCase()}: ${message}`
})

const logger = createLogger({
    level: config.get('logs.level'),
    format: combine(
        format.splat(),
        timestamp(),
        lFormat
    ),
    transports: [new transports.Console()]
})

module.exports = logger
