import Web3 from 'web3'

let Web3Global = null
let Web3Util = {
	getWeb3: async () => {
    Web3Global = Web3Global ? Web3Global : await new Web3( new Web3.providers.HttpProvider( process.env.WEB3_URI ) )

		return Web3Global
	}
}

export default Web3Util