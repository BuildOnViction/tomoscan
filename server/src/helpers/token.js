'use strict'

const { formatAscIIJSON } = require('./utils')
const config = require('config')
const Web3Util = require('./web3')
const axios = require('axios')
const BigNumber = require('bignumber.js')

let TokenHelper = {
    getTokenFuncs: async () => ({
        'decimals': '0x313ce567', // hex to decimal
        'symbol': '0x95d89b41', // hex to ascii
        'totalSupply': '0x18160ddd',
        'name': '0x06fdde03'
    }),

    checkIsToken:async (code) => {
        let tokenFuncs = await TokenHelper.getTokenFuncs()
        for (let name in tokenFuncs) {
            let codeCheck = tokenFuncs[name]
            codeCheck = codeCheck.replace('0x', '')
            if (code.indexOf(codeCheck) >= 0) {
                return true
            }
        }

        return false
    },

    formatToken: async (item) => {
        item.name = await formatAscIIJSON(item.name)
        item.symbol = await formatAscIIJSON(item.symbol)

        return item
    },

    getTokenBalance: async (token, holder) => {
        let web3 = await Web3Util.getWeb3()
        // 0x70a08231 is mean balanceOf(address)
        let data = '0x70a08231' +
            '000000000000000000000000' +
            holder.substr(2) // chop off the 0x

        const res = await axios.post(config.get('WEB3_URI'), {
            'jsonrpc': '2.0',
            'method': 'eth_call',
            'params': [{
                to: token.hash,
                data: data
            }, 'latest'],
            'id': 88
        })

        if (!res.error) {
            let result = res.data.result
            let quantity = new BigNumber(await web3.utils.hexToNumberString(result))
            let quantityNumber = quantity.dividedBy(10 ** token.decimals).toNumber()
            return { quantity: quantity.toString(10), quantityNumber: quantityNumber }
        }
        return { quantity: '0', quantityNumber: 0 }
    }
}

module.exports = TokenHelper
