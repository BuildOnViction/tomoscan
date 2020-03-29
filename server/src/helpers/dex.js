'use strict'

const Web3Util = require('./web3')
const BigNumber = require('bignumber.js')
const db = require('../models')
const utils = require('./utils')
const decimalFunction = '0x313ce567'
const symbolFunction = '0x95d89b41'
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
    },

    formatLendingOrder: async (orders) => {
        let web3 = await Web3Util.getWeb3()
        let decimals = {}
        for (let i = 0; i < orders.length; i++) {
            let lt = orders[i].lendingToken.toLowerCase()
            if (!decimals.hasOwnProperty(lt)) {
                if (lt === TomoToken) {
                    decimals[lt] = 18
                } else {
                    let token = await db.Token.findOne({ hash: lt })
                    if (token) {
                        decimals[lt] = { decimals: token.decimals, symbol: token.symbol }
                    } else {
                        let dcm = await web3.eth.call({ to: lt, data: decimalFunction })
                        dcm = await web3.utils.hexToNumber(dcm)

                        let symbol = await web3.eth.call({ to: token.hash, data: symbolFunction })
                        symbol = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(symbol))
                        decimals[lt] = { decimals: dcm, symbol: symbol }
                    }
                }
            }
        }
        for (let i = 0; i < orders.length; i++) {
            let quantity = new BigNumber(orders[i].quantity)
            let lt = orders[i].lendingToken.toLowerCase()
            quantity = quantity.dividedBy(10 ** decimals[lt].decimals).toNumber()

            let fillAmount = new BigNumber(orders[i].filledAmount)
            fillAmount = fillAmount.dividedBy(10 ** decimals[lt].decimals).toNumber()

            let interest = new BigNumber(orders[i].interest)
            interest = interest.dividedBy(10 ** 8).toNumber()

            orders[i].lendingDecimals = decimals[lt].decimals
            orders[i].lendingSymbol = decimals[lt].symbol
            orders[i].interest = interest
            orders[i].filledAmount = fillAmount
            orders[i].quantity = quantity
        }
        return orders
    },

    formatTrade: async (trades) => {
        let web3 = await Web3Util.getWeb3()
        let decimals = {}
        for (let i = 0; i < trades.length; i++) {
            let bt = trades[i].baseToken.toLowerCase()
            if (!decimals.hasOwnProperty(bt)) {
                if (bt === TomoToken) {
                    decimals[bt] = 18
                } else {
                    let baseDecimals = await web3.eth.call({ to: bt, data: decimalFunction })
                    baseDecimals = await web3.utils.hexToNumber(baseDecimals)
                    decimals[bt] = baseDecimals
                }
            }
            let qt = trades[i].quoteToken.toLowerCase()
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
        for (let i = 0; i < trades.length; i++) {
            let quantity = new BigNumber(trades[i].quantity)
            let bt = trades[i].baseToken.toLowerCase()
            let qt = trades[i].quoteToken.toLowerCase()
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
    },

    formatLendingTrade: async (trades) => {
        let web3 = await Web3Util.getWeb3()
        let decimals = {}
        for (let i = 0; i < trades.length; i++) {
            let ct = trades[i].collateralToken.toLowerCase()
            if (!decimals.hasOwnProperty(ct)) {
                if (ct === TomoToken) {
                    decimals[ct] = 18
                } else {
                    let baseDecimals = await web3.eth.call({ to: ct, data: decimalFunction })
                    baseDecimals = await web3.utils.hexToNumber(baseDecimals)
                    decimals[ct] = baseDecimals
                }
            }
            let lt = trades[i].lendingToken.toLowerCase()
            if (!decimals.hasOwnProperty(lt)) {
                if (lt === TomoToken) {
                    decimals[lt] = 18
                } else {
                    let quoteDecimals = await web3.eth.call({ to: lt, data: decimalFunction })
                    quoteDecimals = await web3.utils.hexToNumber(quoteDecimals)
                    decimals[lt] = quoteDecimals
                }
            }
        }
        for (let i = 0; i < trades.length; i++) {
            let quantity = new BigNumber(trades[i].quantity)
            let ct = trades[i].collateralToken.toLowerCase()
            let lt = trades[i].lendingToken.toLowerCase()
            quantity = quantity.dividedBy(10 ** decimals[ct]).toNumber()

            let amount = new BigNumber(trades[i].amount)
            amount = amount.dividedBy(10 ** decimals[lt]).toNumber()

            let borrowingFee = new BigNumber(trades[i].borrowingFee)
            borrowingFee = borrowingFee.dividedBy(10 ** decimals[lt]).toNumber()

            let collateralPrice = new BigNumber(trades[i].collateralPrice)
            collateralPrice = collateralPrice.dividedBy(10 ** decimals[lt]).toNumber()

            let liquidationPrice = new BigNumber(trades[i].liquidationPrice)
            liquidationPrice = liquidationPrice.dividedBy(10 ** decimals[lt]).toNumber()

            let collateralLockedAmount = new BigNumber(trades[i].collateralLockedAmount)
            collateralLockedAmount = collateralLockedAmount.dividedBy(10 ** decimals[ct]).toNumber()

            trades[i].collateralDecimals = decimals[ct]
            trades[i].lendingDecimals = decimals[lt]
            trades[i].amount = amount
            trades[i].borrowingFee = borrowingFee
            trades[i].liquidationPrice = liquidationPrice
            trades[i].collateralPrice = collateralPrice
            trades[i].collateralLockedAmount = collateralLockedAmount
        }
        return trades
    }
}

module.exports = DexHelper
