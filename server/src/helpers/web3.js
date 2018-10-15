const Web3 = require('web3')
const config = require('config')
// const config = require('config')

let Web3Http = null
let Web3Socket = null
let Web3Util = {
    getWeb3: async () => {
        Web3Http = Web3Http || await new Web3(new Web3.providers.HttpProvider(config.get('WEB3_URI')))

        return Web3Http
    },

    getWeb3Socket: async () => {
        if (!config.get('WEB3_WS_URI')) {
            return false
        }
        Web3Socket = Web3Socket || await new Web3(new Web3.providers.WebsocketProvider(config.get('WEB3_WS_URI')))

        return Web3Socket
    }
}

module.exports = Web3Util
