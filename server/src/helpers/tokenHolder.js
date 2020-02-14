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
            let tk = await db.Token.findOne({ hash: token })
            let decimals
            let tokenType
            if (tk) {
                decimals = tk.decimals
                tokenType = tk.type
            } else {
                let web3 = await Web3Util.getWeb3()
                let tokenFuncs = await TokenHelper.getTokenFuncs()
                decimals = await web3.eth.call({ to: token, data: tokenFuncs['decimals'] })
                decimals = await web3.utils.hexToNumberString(decimals)
                let code = await web3.eth.getCode(token)
                if (code === '0x') {
                    tokenType = null
                }
                tokenType = await TokenHelper.checkTokenType(code)
            }
            let holder = null
            if (tokenType === 'trc20') {
                holder = await db.TokenHolder.findOne({ hash: hash, token: token })
                if (!holder) {
                    // Create new.
                    holder = await db.TokenHolder.create({
                        hash: hash,
                        token: token,
                        quantity: 0
                    })
                }
            } else if (tokenType === 'trc21') {
                holder = await db.TokenTrc21Holder.findOne({ hash: hash, token: token })
                if (!holder) {
                    // Create new.
                    holder = await db.TokenTrc21Holder.create({
                        hash: hash,
                        token: token,
                        quantity: 0
                    })
                }
            }
            if (holder !== null) {
                let { quantity, quantityNumber } = TokenHelper.getTokenBalance(token, hash)
                holder.quantity = quantity
                holder.quantityNumber = quantityNumber
                await holder.save()
            }
        } catch (e) {
            logger.warn('token updateQuality error %s', e)
        }
    }
}

module.exports = TokenHolderHelper
