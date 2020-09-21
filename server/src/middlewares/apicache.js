const redis = require('redis')
const apicache = require('apicache')
const config = require('config')

const apiCacheWithRedis = apicache.options({
    redisClient: redis.createClient({
        port: config.get('redis.port'),
        host: config.get('redis.host'),
        auth: config.get('redis.password')
    }),
    statusCodes: {
        include: [200]
    }
}).middleware

module.exports = { apicache, apiCacheWithRedis }
