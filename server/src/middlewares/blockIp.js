const redis = require('../helpers/redis')
const axios = require('axios')
const config = require('config')
const blacklistIp = require('../../config/blacklist-ip.json')
const whitelistIp = require('../../config/whitelist-ip.json')
module.exports = function (options) {
    return async function (req, res, next) {
        const ffHeaderValue = req.header('x-forwarded-for') ? req.header('x-forwarded-for').split(',')[0] : ''
        const ip = ffHeaderValue || req.connection.remoteAddress

        if (blacklistIp.includes(ip)) {
            return res.status(403).json({ errors: 'Access denied' })
        }
        if (whitelistIp.includes(ip)) {
            return next()
        }
        if (ip && ip !== '::1' && ip !== '127.0.0.1') {
            let cache5min = await redis.get(`total-request-5min-${ip}`)
            let cache1day = await redis.get(`total-request-1day-${ip}`)
            if (!cache5min) {
                // eslint-disable-next-line
                const url5min = `https://graylog.tomochain.com/api/search/universal/relative?query=message%3A${ip}&range=300&limit=1&fields=message&sort=desc&decorate=true&filter=streams%3A5bd804ebf13e3300018780df`
                const { data } = await axios.get(url5min, {
                    headers: {
                        accept: 'application/json',
                        authorization: config.get('graylog.authorization')
                    }
                })
                cache5min = data.total_results
                await redis.set(`total-request-5min-${ip}`, cache5min, 600)
            }
            if (cache5min && parseInt(cache5min) > 1000) {
                return res.status(403).json({ errors: 'Limit 100k requests/day, 1000 requests/5minutes' })
            }

            if (!cache1day) {
                // eslint-disable-next-line
                const url1day = `https://graylog.tomochain.com/api/search/universal/relative?query=message%3A${ip}&range=86400&limit=1&fields=message&sort=desc&decorate=true&filter=streams%3A5bd804ebf13e3300018780df`
                const { data } = await axios.get(url1day, {
                    headers: {
                        accept: 'application/json',
                        authorization: config.get('graylog.authorization')
                    }
                })
                cache1day = data.total_results
                await redis.set(`total-request-1day-${ip}`, cache1day, 3600)
            }
            if (cache1day && parseInt(cache1day) > 100000) {
                return res.status(403).json({ errors: 'Limit 100k requests/day, 1000 requests/5minutes' })
            }
        }
        return next()
    }
}
