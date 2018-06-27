import Web3Util from '../helpers/web3'
import Token from '../models/Token'
import { formatAscIIJSON, trimWord } from '../helpers/utils'
import TokenTx from '../models/TokenTx'
import CrawlRepository from './CrawlRepository'

let TokenRepository = {
    getTokenFuncs: () => ({
        'decimals': '0x313ce567', // hex to decimal
        'symbol': '0x95d89b41', // hex to ascii
        'totalSupply': '0x18160ddd',
        'name': '0x06fdde03'
    }),

    checkIsToken: (code) => {
        let tokenFuncs = TokenRepository.getTokenFuncs()
        let isToken = false
        for (let name in tokenFuncs) {
            let codeCheck = tokenFuncs[name]
            codeCheck = codeCheck.replace('0x', '')
            if (code.indexOf(codeCheck) >= 0) {
                isToken = true
            }
        }

        return isToken
    },

    addTokenPending: async (hash) => {
        await CrawlRepository.add('token', hash)

        let token = await Token.findOneAndUpdate({ hash: hash },
            { hash: hash, status: false }, { upsert: true, new: true })
        return token
    },

    updateToken: async (address) => {
        try {
            let token = await Token.findOne({ hash: address })
            if (!token) {
                return false
            }
            let tokenFuncs = TokenRepository.getTokenFuncs()

            let web3 = await Web3Util.getWeb3()
            if (typeof token.name === 'undefined') {
                let name = await web3.eth.call(
                    { to: token.hash, data: tokenFuncs['name'] })
                token.name = trimWord(web3.utils.hexToUtf8(name))
            }

            if (typeof token.symbol === 'undefined') {
                let symbol = await web3.eth.call(
                    { to: token.hash, data: tokenFuncs['symbol'] })
                token.symbol = trimWord(web3.utils.hexToUtf8(symbol))
            }

            if (typeof token.decimals === 'undefined') {
                let decimals = await web3.eth.call(
                    { to: token.hash, data: tokenFuncs['decimals'] })
                token.decimals = web3.utils.hexToNumberString(decimals)
            }

            let totalSupply = await web3.eth.call(
                { to: token.hash, data: tokenFuncs['totalSupply'] })
            totalSupply = web3.utils.hexToNumberString(totalSupply).trim()
            token.totalSupply = totalSupply
            token.totalSupplyNumber = totalSupply

            token.status = true
            token.save()

            return token
        } catch (e) {
            console.trace(e)
            console.log(e)
            return null
        }
    },

    formatItem: async (item) => {
        item.tokenTxsCount = await TokenTx.find({ address: item.hash }).count()
        item.name = formatAscIIJSON(item.name)
        item.symbol = formatAscIIJSON(item.symbol)
        item.totalSupply = item.totalSupply / Math.pow(10, item.decimals)

        return item
    }
}

export default TokenRepository
