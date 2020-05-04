'use strict'

const Web3Util = require('./web3')
const BigNumber = require('bignumber.js')
const db = require('../models')
const utils = require('./utils')
const decimalFunction = '0x313ce567'
const symbolFunction = '0x95d89b41'
const TomoToken = '0x0000000000000000000000000000000000000001'

const DexHelper = {
    formatOrder: async (orders) => {
        const web3 = await Web3Util.getWeb3()
        const decimals = {}
        for (let i = 0; i < orders.length; i++) {
            const bt = orders[i].baseToken.toLowerCase()
            if (!Object.prototype.hasOwnProperty.call(decimals, bt)) {
                if (bt === TomoToken) {
                    decimals[bt] = { decimals: 18, symbol: 'TOMO' }
                } else {
                    const token = await db.Token.findOne({ hash: bt })
                    if (token) {
                        decimals[bt] = { decimals: token.decimals, symbol: token.symbol }
                    } else {
                        let baseDecimals = await web3.eth.call({ to: bt, data: decimalFunction })
                        baseDecimals = await web3.utils.hexToNumber(baseDecimals)

                        let symbol = await web3.eth.call({ to: bt, data: symbolFunction })
                        symbol = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(symbol))
                        decimals[bt] = { decimals: baseDecimals, symbol: symbol }
                    }
                }
            }
            const qt = orders[i].quoteToken.toLowerCase()
            if (!Object.prototype.hasOwnProperty.call(decimals, qt)) {
                if (qt === TomoToken) {
                    decimals[qt] = { decimals: 18, symbol: 'TOMO' }
                } else {
                    const token = await db.Token.findOne({ hash: qt })
                    if (token) {
                        decimals[qt] = { decimals: token.decimals, symbol: token.symbol }
                    } else {
                        let quoteDecimals = await web3.eth.call({ to: qt, data: decimalFunction })
                        quoteDecimals = await web3.utils.hexToNumber(quoteDecimals)

                        let symbol = await web3.eth.call({ to: qt, data: symbolFunction })
                        symbol = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(symbol))
                        decimals[qt] = { decimals: quoteDecimals, symbol: symbol }
                    }
                }
            }
        }
        for (let i = 0; i < orders.length; i++) {
            let quantity = new BigNumber(orders[i].quantity)
            const bt = orders[i].baseToken.toLowerCase()
            const qt = orders[i].quoteToken.toLowerCase()
            quantity = quantity.dividedBy(10 ** decimals[bt].decimals).toNumber()

            let fillAmount = new BigNumber(orders[i].filledAmount)
            fillAmount = fillAmount.dividedBy(10 ** decimals[bt].decimals).toNumber()

            let price = new BigNumber(orders[i].price)
            price = price.dividedBy(10 ** decimals[qt].decimals).toNumber()

            orders[i].baseDecimals = decimals[bt].decimals
            orders[i].baseSymbol = decimals[bt].symbol.toUpperCase()
            orders[i].quoteDecimals = decimals[qt].decimals
            orders[i].quoteSymbol = decimals[qt].symbol.toUpperCase()
            orders[i].pairName = orders[i].baseSymbol + '/' + orders[i].quoteSymbol
            orders[i].price = price
            orders[i].filledAmount = fillAmount
            orders[i].quantity = quantity
            if (orders[i].status === 'CANCELLED') {
                const extraData = JSON.parse(orders[i].extraData)
                if (Object.prototype.hasOwnProperty.call(extraData, 'CancelFee')) {
                    let cancelFee = new BigNumber(extraData.CancelFee)
                    if (orders[i].side === 'BUY') {
                        cancelFee = cancelFee.dividedBy(10 ** decimals[qt].decimals).toNumber()
                    } else {
                        cancelFee = cancelFee.dividedBy(10 ** decimals[bt].decimals).toNumber()
                    }
                    orders[i].cancelFee = cancelFee
                }
            }
        }
        return orders
    },

    formatLendingOrder: async (orders) => {
        const web3 = await Web3Util.getWeb3()
        const decimals = {}
        for (let i = 0; i < orders.length; i++) {
            const lt = orders[i].lendingToken.toLowerCase()
            const ct = orders[i].collateralToken.toLowerCase()
            if (!Object.prototype.hasOwnProperty.call(decimals, lt)) {
                if (lt === TomoToken) {
                    decimals[lt] = { decimals: 18, symbol: 'TOMO' }
                } else {
                    const token = await db.Token.findOne({ hash: lt })
                    if (token) {
                        decimals[lt] = { decimals: token.decimals, symbol: token.symbol }
                    } else {
                        let dcm = await web3.eth.call({ to: lt, data: decimalFunction })
                        dcm = await web3.utils.hexToNumber(dcm)

                        let symbol = await web3.eth.call({ to: lt, data: symbolFunction })
                        symbol = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(symbol))
                        decimals[lt] = { decimals: dcm, symbol: symbol }
                    }
                }
            }
            if (!Object.prototype.hasOwnProperty.call(decimals, ct)) {
                if (ct === TomoToken) {
                    decimals[ct] = { decimals: 18, symbol: 'TOMO' }
                } else {
                    const token = await db.Token.findOne({ hash: ct })
                    if (token) {
                        decimals[ct] = { decimals: token.decimals, symbol: token.symbol }
                    } else {
                        let dcm = await web3.eth.call({ to: ct, data: decimalFunction })
                        dcm = await web3.utils.hexToNumber(dcm)

                        let symbol = await web3.eth.call({ to: ct, data: symbolFunction })
                        symbol = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(symbol))
                        decimals[ct] = { decimals: dcm, symbol: symbol }
                    }
                }
            }
        }
        for (let i = 0; i < orders.length; i++) {
            let quantity = new BigNumber(orders[i].quantity)
            const lt = orders[i].lendingToken.toLowerCase()
            const ct = orders[i].collateralToken.toLowerCase()
            quantity = quantity.dividedBy(10 ** decimals[lt].decimals).toNumber()

            let fillAmount = new BigNumber(orders[i].filledAmount)
            fillAmount = fillAmount.dividedBy(10 ** decimals[lt].decimals).toNumber()

            let interest = new BigNumber(orders[i].interest)
            interest = interest.dividedBy(10 ** 8).toNumber()

            orders[i].lendingDecimals = decimals[lt].decimals
            orders[i].lendingSymbol = decimals[lt].symbol.toUpperCase()
            orders[i].collateralDecimals = decimals[ct].decimals
            orders[i].collateralSymbol = decimals[ct].symbol.toUpperCase()
            orders[i].interest = interest
            orders[i].filledAmount = fillAmount
            orders[i].quantity = quantity
            if (orders[i].status === 'CANCELLED') {
                const extraData = JSON.parse(orders[i].extraData)
                if (Object.prototype.hasOwnProperty.call(extraData, 'CancelFee')) {
                    let cancelFee = new BigNumber(extraData.CancelFee)
                    if (orders[i].side === 'BORROW') {
                        cancelFee = cancelFee.dividedBy(10 ** decimals[ct].decimals).toNumber()
                    } else {
                        cancelFee = cancelFee.dividedBy(10 ** decimals[lt].decimals).toNumber()
                    }
                    orders[i].cancelFee = cancelFee
                }
            }
        }
        return orders
    },

    formatLendingTopup: async (orders) => {
        const web3 = await Web3Util.getWeb3()
        const decimals = {}
        for (let i = 0; i < orders.length; i++) {
            const ct = orders[i].collateralToken.toLowerCase()
            if (!Object.prototype.hasOwnProperty.call(decimals, ct)) {
                if (ct === TomoToken) {
                    decimals[ct] = { decimals: 18, symbol: 'TOMO' }
                } else {
                    const token = await db.Token.findOne({ hash: ct })
                    if (token) {
                        decimals[ct] = { decimals: token.decimals, symbol: token.symbol }
                    } else {
                        let dcm = await web3.eth.call({ to: ct, data: decimalFunction })
                        dcm = await web3.utils.hexToNumber(dcm)

                        let symbol = await web3.eth.call({ to: ct, data: symbolFunction })
                        symbol = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(symbol))
                        decimals[ct] = { decimals: dcm, symbol: symbol }
                    }
                }
            }
        }
        for (let i = 0; i < orders.length; i++) {
            let quantity = new BigNumber(orders[i].quantity)
            const ct = orders[i].collateralToken.toLowerCase()
            quantity = quantity.dividedBy(10 ** decimals[ct].decimals).toNumber()

            let fillAmount = new BigNumber(orders[i].filledAmount)
            fillAmount = fillAmount.dividedBy(10 ** decimals[ct].decimals).toNumber()

            let interest = new BigNumber(orders[i].interest)
            interest = interest.dividedBy(10 ** 8).toNumber()

            orders[i].collateralDecimals = decimals[ct].decimals
            orders[i].collateralSymbol = decimals[ct].symbol.toUpperCase()
            orders[i].interest = interest
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
                    decimals[bt] = { decimals: 18, symbol: 'TOMO' }
                } else {
                    const token = await db.Token.findOne({ hash: bt })
                    if (token) {
                        decimals[bt] = { decimals: token.decimals, symbol: token.symbol }
                    } else {
                        let baseDecimals = await web3.eth.call({ to: bt, data: decimalFunction })
                        baseDecimals = await web3.utils.hexToNumber(baseDecimals)

                        let symbol = await web3.eth.call({ to: bt, data: symbolFunction })
                        symbol = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(symbol))
                        decimals[bt] = { decimals: baseDecimals, symbol: symbol }
                    }
                }
            }
            const qt = trades[i].quoteToken.toLowerCase()
            if (!Object.prototype.hasOwnProperty.call(decimals, qt)) {
                if (qt === TomoToken) {
                    decimals[qt] = { decimals: 18, symbol: 'TOMO' }
                } else {
                    const token = await db.Token.findOne({ hash: qt })
                    if (token) {
                        decimals[qt] = { decimals: token.decimals, symbol: token.symbol }
                    } else {
                        let quoteDecimals = await web3.eth.call({ to: qt, data: decimalFunction })
                        quoteDecimals = await web3.utils.hexToNumber(quoteDecimals)

                        let symbol = await web3.eth.call({ to: qt, data: symbolFunction })
                        symbol = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(symbol))
                        decimals[qt] = { decimals: quoteDecimals, symbol: symbol }
                    }
                }
            }
        }
        for (let i = 0; i < trades.length; i++) {
            let quantity = new BigNumber(trades[i].quantity)
            const bt = trades[i].baseToken.toLowerCase()
            const qt = trades[i].quoteToken.toLowerCase()
            quantity = quantity.dividedBy(10 ** decimals[bt].decimals).toNumber()

            let amount = new BigNumber(trades[i].amount)
            amount = amount.dividedBy(10 ** decimals[bt].decimals).toNumber()

            let pricepoint = new BigNumber(trades[i].pricepoint)
            pricepoint = pricepoint.dividedBy(10 ** decimals[qt].decimals).toNumber()

            let makeFee = new BigNumber(trades[i].makeFee)
            makeFee = makeFee.dividedBy(10 ** decimals[qt].decimals).toNumber()

            let takeFee = new BigNumber(trades[i].makeFee)
            takeFee = takeFee.dividedBy(10 ** decimals[qt].decimals).toNumber()

            trades[i].baseDecimals = decimals[bt].decimals
            trades[i].baseSymbol = decimals[bt].symbol.toUpperCase()
            trades[i].quoteDecimals = decimals[qt].decimals
            trades[i].quoteSymbol = decimals[qt].symbol.toUpperCase()
            trades[i].pairName = trades[i].baseSymbol + '/' + trades[i].quoteSymbol
            trades[i].pricepoint = pricepoint
            trades[i].amount = amount
            trades[i].makeFee = makeFee
            trades[i].takeFee = takeFee
        }
        return trades
    },

    formatLendingTrade: async (trades) => {
        const web3 = await Web3Util.getWeb3()
        const decimals = {}
        for (let i = 0; i < trades.length; i++) {
            const ct = trades[i].collateralToken.toLowerCase()
            if (!Object.prototype.hasOwnProperty.call(decimals, ct)) {
                if (ct === TomoToken) {
                    decimals[ct] = { decimals: 18, symbol: 'TOMO' }
                } else {
                    const token = await db.Token.findOne({ hash: ct })
                    if (token) {
                        decimals[ct] = { decimals: token.decimals, symbol: token.symbol }
                    } else {
                        let dcm = await web3.eth.call({ to: ct, data: decimalFunction })
                        dcm = await web3.utils.hexToNumber(dcm)

                        let symbol = await web3.eth.call({ to: ct, data: symbolFunction })
                        symbol = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(symbol))
                        decimals[ct] = { decimals: dcm, symbol: symbol }
                    }
                }
            }
            const lt = trades[i].lendingToken.toLowerCase()
            if (!Object.prototype.hasOwnProperty.call(decimals, lt)) {
                if (lt === TomoToken) {
                    decimals[lt] = { decimals: 18, symbol: 'TOMO' }
                } else {
                    const token = await db.Token.findOne({ hash: lt })
                    if (token) {
                        decimals[lt] = { decimals: token.decimals, symbol: token.symbol }
                    } else {
                        let dcm = await web3.eth.call({ to: lt, data: decimalFunction })
                        dcm = await web3.utils.hexToNumber(dcm)

                        let symbol = await web3.eth.call({ to: lt, data: symbolFunction })
                        symbol = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(symbol))
                        decimals[lt] = { decimals: dcm, symbol: symbol }
                    }
                }
            }
        }
        for (let i = 0; i < trades.length; i++) {
            let quantity = new BigNumber(trades[i].quantity)
            const ct = trades[i].collateralToken.toLowerCase()
            const lt = trades[i].lendingToken.toLowerCase()
            quantity = quantity.dividedBy(10 ** decimals[ct].decimals).toNumber()

            let amount = new BigNumber(trades[i].amount)
            amount = amount.dividedBy(10 ** decimals[lt].decimals).toNumber()

            let borrowingFee = new BigNumber(trades[i].borrowingFee)
            borrowingFee = borrowingFee.dividedBy(10 ** decimals[lt].decimals).toNumber()

            let collateralPrice = new BigNumber(trades[i].collateralPrice)
            collateralPrice = collateralPrice.dividedBy(10 ** decimals[lt].decimals).toNumber()

            let liquidationPrice = new BigNumber(trades[i].liquidationPrice)
            liquidationPrice = liquidationPrice.dividedBy(10 ** decimals[lt].decimals).toNumber()

            let collateralLockedAmount = new BigNumber(trades[i].collateralLockedAmount)
            collateralLockedAmount = collateralLockedAmount.dividedBy(10 ** decimals[ct].decimals).toNumber()

            let interest = new BigNumber(trades[i].interest)
            interest = interest.dividedBy(10 ** 8).toNumber()

            trades[i].collateralDecimals = decimals[ct].decimals
            trades[i].collateralSymbol = decimals[ct].symbol.toUpperCase()
            trades[i].lendingDecimals = decimals[lt].decimals
            trades[i].lendingSymbol = decimals[lt].symbol.toUpperCase()
            trades[i].amount = amount
            trades[i].interest = interest
            trades[i].borrowingFee = borrowingFee
            trades[i].liquidationPrice = liquidationPrice
            trades[i].collateralPrice = collateralPrice
            trades[i].collateralLockedAmount = collateralLockedAmount
        }
        return trades
    }
}

module.exports = DexHelper
