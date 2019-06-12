'use strict'

const { formatAscIIJSON } = require('./utils')
const Web3Util = require('./web3')
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

        let result = await web3.eth.call({ to: token, data: data })

        let quantity = new BigNumber(await web3.utils.hexToNumberString(result))
        let quantityNumber = quantity.dividedBy(10 ** token.decimals).toNumber()
        return { quantity: quantity.toString(10), quantityNumber: quantityNumber }
    }
}

module.exports = TokenHelper
