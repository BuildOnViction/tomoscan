'use strict'

const BigNumber = require('bignumber.js')
const db = require('../models')
const TokenHelper = require('./token')
const Web3Util = require('../helpers/web3')
const logger = require('../helpers/logger')

let TokenHolderHelper = {
    formatHolder: async (tokenHolder, totalSupply, decimals) => {
        if (totalSupply) {
            totalSupply = new BigNumber(totalSupply)
            let quantity = new BigNumber(tokenHolder.quantity)

            let percentage = await quantity.div(totalSupply) * 100
            percentage = percentage.toFixed(4)
            percentage = (percentage.toString() === '0.0000') ? '< 0.0001' : percentage
            tokenHolder.percentage = percentage
        }

        return tokenHolder
    },

    updateQuality: async (hash, token, quantity) => {
        try {
            let holder = await db.TokenHolder.findOne({ hash: hash, token: token })
            if (!holder) {
                // Create new.
                holder = await db.TokenHolder.create({
                    hash: hash,
                    token: token,
                    quantity: 0
                })
            }
            let tk = await db.Token.findOne({ hash: token })
            let decimals
            if (tk) {
                decimals = tk.decimals
            } else {
                let web3 = await Web3Util.getWeb3()
                let tokenFuncs = await TokenHelper.getTokenFuncs()
                decimals = await web3.eth.call({ to: token, data: tokenFuncs['decimals'] })
                decimals = await web3.utils.hexToNumberString(decimals)
            }

            let oldQuantity = new BigNumber(holder.quantity || 0)
            let newQuantity = oldQuantity.plus(quantity)
            holder.quantity = newQuantity.toString()
            holder.quantityNumber = newQuantity.dividedBy(10 ** parseInt(decimals)).toNumber() || 0
            holder.save()
        } catch (e) {
            logger.warn('token updateQuality error %s', e)
        }
    }
}

module.exports = TokenHolderHelper
