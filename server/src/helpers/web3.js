import Web3 from 'web3'

let Web3Http = null
let Web3Socket = null
let Web3Util = {
  getWeb3: async () => {
    Web3Http = Web3Http ? Web3Http : await new Web3(
      new Web3.providers.HttpProvider(process.env.WEB3_URI))

    return Web3Http
  },

  getWeb3Socket: async () => {
    if (!process.env.WEB3_WS_URI) {
      return false
    }
    Web3Socket = Web3Socket ? Web3Socket : await new Web3(
      new Web3.providers.WebsocketProvider(process.env.WEB3_WS_URI))

    return Web3Socket
  },
}

export default Web3Util