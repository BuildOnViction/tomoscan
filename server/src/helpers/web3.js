const Web3 = require('web3')
const config = require('config')
const logger = require('./logger')

let Web3Socket = null
let Web3Util = {
    getWeb3: async () => {
        return new Web3(new Web3.providers.HttpProvider(config.get('WEB3_URI')))
    },

    getWeb3Socket: async () => {
        if (!config.get('WEB3_WS_URI')) {
            return false
        }
        Web3Socket = Web3Socket || await new Web3(new Web3.providers.WebsocketProvider(config.get('WEB3_WS_URI')))

        return Web3Socket
    },
    reconnectWeb3Socket: async () => {
        logger.info('Websocket closed/errored')
        logger.info('Attempting to reconnect...')
        let provider = await new Web3.providers.WebsocketProvider(config.get('WEB3_WS_URI'))
        Web3Socket.setProvider(provider)

        provider.on('connect', function () {
            logger.info('Websocket Reconnected')
        })
    }
}

module.exports = Web3Util
