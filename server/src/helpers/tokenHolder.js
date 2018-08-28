'use strict'

import { convertHexToFloat } from './utils'
import BigNumber from 'bignumber.js'

let TokenHolderHelper = {
    formatHolder (tokenHolder, totalSupply, decimals) {
        if (totalSupply) {
            totalSupply = new BigNumber(totalSupply)
            let quantity = new BigNumber(convertHexToFloat(tokenHolder.quantity, 16))
            console.log('quantity:', quantity.toString())
            console.log('totalSupply:', totalSupply.toString())
            let percentAge = quantity.div(10 ** decimals).div(totalSupply) * 100
            percentAge = percentAge.toFixed(4)
            percentAge = (percentAge.toString() === '0.0000') ? '0.0001' : percentAge
            tokenHolder.percentAge = percentAge
        }

        return tokenHolder
    }
}

export default TokenHolderHelper
