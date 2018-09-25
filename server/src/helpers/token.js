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
        let tokenFuncs = await TokenHelper.getTokenFuncs()
        let isToken = false
        for (let name in tokenFuncs) {
            let codeCheck = tokenFuncs[name]
            codeCheck = codeCheck.replace('0x', '')
            if (code.indexOf(codeCheck) >= 0) {
                console.log(11111111)
                isToken = true
            }
        }

        return isToken
    },

    formatToken: async (item) => {
        item.tokenTxsCount = await db.TokenTx.find({ address: item.hash.toLowerCase() }).count()
        item.name = formatAscIIJSON(item.name)
        item.symbol = formatAscIIJSON(item.symbol)

        return item
    }
}

export default TokenHelper
