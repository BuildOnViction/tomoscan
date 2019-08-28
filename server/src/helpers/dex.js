'use strict'

const Web3Util = require('./web3')
const BigNumber = require('bignumber.js')
const decimalFunction = '0x313ce567'
const TomoToken = '0x0000000000000000000000000000000000000001'

let DexHelper = {
    formatOrder: async (orders) => {
        let web3 = await Web3Util.getWeb3()
        let decimals = {}
        for (let i = 0; i < orders.length; i++) {
            let bt = orders[i].baseToken.toLowerCase()
            if (!decimals.hasOwnProperty(bt)) {
                if (bt === TomoToken) {
                    decimals[bt] = 18
                } else {
                    let baseDecimals = await web3.eth.call({ to: bt, data: decimalFunction })
                    baseDecimals = await web3.utils.hexToNumber(baseDecimals)
                    decimals[bt] = baseDecimals
                }
            }
            let qt = orders[i].quoteToken.toLowerCase()
            if (!decimals.hasOwnProperty(qt)) {
                if (qt === TomoToken) {
                    decimals[qt] = 18
                } else {
                    let quoteDecimals = await web3.eth.call({ to: qt, data: decimalFunction })
                    quoteDecimals = await web3.utils.hexToNumber(quoteDecimals)
                    decimals[qt] = quoteDecimals
                }
            }
        }
        for (let i = 0; i < orders.length; i++) {
            let quantity = new BigNumber(orders[i].quantity)
            let bt = orders[i].baseToken.toLowerCase()
            let qt = orders[i].quoteToken.toLowerCase()
            quantity = quantity.dividedBy(10 ** decimals[bt]).toNumber()

            let fillAmount = new BigNumber(orders[i].filledAmount)
            fillAmount = fillAmount.dividedBy(10 ** decimals[bt]).toNumber()

            let price = new BigNumber(orders[i].price)
            price = price.dividedBy(10 ** decimals[qt]).toNumber()

            orders[i].baseDecimals = decimals[bt]
            orders[i].quoteDecimals = decimals[qt]
            orders[i].price = price
            orders[i].filledAmount = fillAmount
            orders[i].quantity = quantity
        }
        return orders
    }
}

module.exports = DexHelper
