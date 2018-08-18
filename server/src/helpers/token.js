'use strict'

import db from '../models'
import { formatAscIIJSON } from './utils'

let TokenHelper = {
    getTokenFuncs: async () => ({
        'decimals': '0x313ce567', // hex to decimal
        'symbol': '0x95d89b41', // hex to ascii
        'totalSupply': '0x18160ddd',
        'name': '0x06fdde03'
    }),

    checkIsToken:async (code) => {
        let tokenFuncs = TokenHelper.getTokenFuncs()
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

    formatItem: async (item) => {
        item.tokenTxsCount = await db.TokenTx.find({ address: item.hash }).count()
        item.name = formatAscIIJSON(item.name)
        item.symbol = formatAscIIJSON(item.symbol)
        item.totalSupply = item.totalSupply / Math.pow(10, item.decimals)

        return item
    }
}

export default TokenHelper
