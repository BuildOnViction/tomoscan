import Web3Util from '../helpers/web3'
import Token from '../models/Token'
import Account from '../models/Account'

let TokenRepository = {
  getTokenFuncs: () => ({
    'decimals': '0x313ce567',//hex to decimal
    'symbol': '0x95d89b41', //hex to ascii
    'totalSupply': '0x18160ddd',
    'name': '0x06fdde03',
  }),

  checkIsToken: (account) => {
    let tokenFuncs = TokenRepository.getTokenFuncs()
    let isToken = false
    for (let name in tokenFuncs) {
      let code = tokenFuncs[name]
      code = code.replace('0x', '')
      if (account.code.indexOf(code) >= 0) {
        isToken = true
      }
    }

    return isToken
  },

  updateToken: async (account) => {
    if (!account) {
      return false
    }

    let isToken = await TokenRepository.checkIsToken(_address)
    let tokenFuncs = TokenRepository.getTokenFuncs()
    let token = null

    if (isToken) {
      token = await Token.findOne({hash: account.hash})
      if (!token) {
        token = new Token()
        token.hash = account.hash
      }

      let web3 = await Web3Util.getWeb3()
      if (!token.hasOwnProperty('name')) {
        let name = await web3.eth.call(
          {to: account.hash, data: tokenFuncs['name']})
        token.name = web3.utils.hexToAscii(name)
      }
      if (!token.hasOwnProperty('symbol')) {
        let symbol = await web3.eth.call(
          {to: account.hash, data: tokenFuncs['symbol']})
        token.symbol = web3.utils.hexToAscii(symbol)
      }
      if (!token.hasOwnProperty('decimals')) {
        let decimals = await web3.eth.call(
          {to: account.hash, data: tokenFuncs['decimals']})

        token.decimals = web3.utils.hexToNumber(decimals)
      }
      let totalSupply = await web3.eth.call(
        {to: account.hash, data: tokenFuncs['totalSupply']})
      totalSupply = web3.utils.hexToNumberString(totalSupply)
      token.totalSupply = totalSupply
      token.totalSupplyNumber = totalSupply

      token = await Token.findOneAndUpdate({hash: token.hash}, token,
        {upsert: true, new: true})
    }

    // Set flag is token for account.
    await Account.update({hash: _address.hash}, {isToken: isToken})

    return token
  },
}

export default TokenRepository