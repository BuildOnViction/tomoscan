'use strict'

const Web3Util = require('./web3')
const BigNumber = require('bignumber.js')
const decimalFunction = '0x313ce567'
const TomoToken = '0x0000000000000000000000000000000000000001'

const DexHelper = {
    formatOrder: async (orders) => {
        const web3 = await Web3Util.getWeb3()
        const decimals = {}
        for (let i = 0; i < orders.length; i++) {
            const bt = orders[i].baseToken.toLowerCase()
            if (!Object.prototype.hasOwnProperty.call(decimals, bt)) {
                if (bt === TomoToken) {
                    decimals[bt] = 18
                } else {
                    let baseDecimals = await web3.eth.call({ to: bt, data: decimalFunction })
                    baseDecimals = await web3.utils.hexToNumber(baseDecimals)
                    decimals[bt] = baseDecimals
                }
            }
            const qt = orders[i].quoteToken.toLowerCase()
            if (!Object.prototype.hasOwnProperty.call(decimals, qt)) {
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
            const bt = orders[i].baseToken.toLowerCase()
            const qt = orders[i].quoteToken.toLowerCase()
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
    },
    formatTrade: async (trades) => {
        const web3 = await Web3Util.getWeb3()
        const decimals = {}
        for (let i = 0; i < trades.length; i++) {
            const bt = trades[i].baseToken.toLowerCase()
            if (!Object.prototype.hasOwnProperty.call(decimals, bt)) {
                if (bt === TomoToken) {
                    decimals[bt] = 18
                } else {
                    let baseDecimals = await web3.eth.call({ to: bt, data: decimalFunction })
                    baseDecimals = await web3.utils.hexToNumber(baseDecimals)
                    decimals[bt] = baseDecimals
                }
            }
            const qt = trades[i].quoteToken.toLowerCase()
            if (!Object.prototype.hasOwnProperty.call(decimals, qt)) {
                if (qt === TomoToken) {
                    decimals[qt] = 18
                } else {
                    let quoteDecimals = await web3.eth.call({ to: qt, data: decimalFunction })
                    quoteDecimals = await web3.utils.hexToNumber(quoteDecimals)
                    decimals[qt] = quoteDecimals
                }
            }
        }
        for (let i = 0; i < trades.length; i++) {
            let quantity = new BigNumber(trades[i].quantity)
            const bt = trades[i].baseToken.toLowerCase()
            const qt = trades[i].quoteToken.toLowerCase()
            quantity = quantity.dividedBy(10 ** decimals[bt]).toNumber()

            let amount = new BigNumber(trades[i].amount)
            amount = amount.dividedBy(10 ** decimals[bt]).toNumber()

            let pricepoint = new BigNumber(trades[i].pricepoint)
            pricepoint = pricepoint.dividedBy(10 ** decimals[qt]).toNumber()

            let makeFee = new BigNumber(trades[i].makeFee)
            makeFee = makeFee.dividedBy(10 ** decimals[qt]).toNumber()

            let takeFee = new BigNumber(trades[i].makeFee)
            takeFee = takeFee.dividedBy(10 ** decimals[qt]).toNumber()

            trades[i].baseDecimals = decimals[bt]
            trades[i].quoteDecimals = decimals[qt]
            trades[i].pricepoint = pricepoint
            trades[i].amount = amount
            trades[i].makeFee = makeFee
            trades[i].takeFee = takeFee
        }
        return trades
    }
}

module.exports = DexHelper
