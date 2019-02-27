'use strict'

const Token = require('../models/Token')
const Block = require('../models/Block')

let TokenTransactionHelper = {

    async formatTokenTransaction (items) {
        // Append token for each TokenTx.
        let res = []
        let tokenHashes = []
        for (let i = 0; i < items.length; i++) {
            tokenHashes.push(items[i]['address'])
        }
        if (tokenHashes.length) {
            let tokens = await Token.find({ hash: { $in: tokenHashes } })
            for (let i = 0; i < items.length; i++) {
                for (let j = 0; j < tokens.length; j++) {
                    if (items[i]['address'] === tokens[j]['hash']) {
                        let item
                        try {
                            item = items[i].toJSON()
                        } catch (e) {
                            item = items[i]
                        }

                        item.symbol = (typeof tokens[j]['symbol'] !== 'undefined')
                            ? tokens[j]['symbol']
                            : null
                        item.decimals = tokens[j].decimals
                        res.push(item)
                    }
                }
            }
        }

        // Append blockTime to TokenTx.
        let blockNumbers = []
        for (let i = 0; i < res.length; i++) {
            blockNumbers.push(res[i]['blockNumber'])
        }
        if (blockNumbers.length) {
            let blocks = await Block.find({ number: { $in: blockNumbers } })
            for (let i = 0; i < res.length; i++) {
                for (let j = 0; j < blocks.length; j++) {
                    if (res[i]['blockNumber'] === blocks[j]['number']) {
                        res[i].blockTime = (typeof blocks[j]['timestamp'] !==
                            'undefined')
                            ? blocks[j]['timestamp']
                            : null
                    }
                }
            }
        }

        return res
    }
}

module.exports = TokenTransactionHelper
