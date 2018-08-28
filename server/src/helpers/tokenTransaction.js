'use strict'

import { convertHexToFloat } from './utils'
import BigNumber from 'bignumber.js'
import Token from "../models/Token";
import Block from "../models/Block";

let TokenTransactionHelper = {

    async formatTokenTransaction (items) {
        // Append token for each TokenTx.
        let tokenHashes = []
        for (let i = 0; i < items.length; i++) {
            tokenHashes.push(items[i]['address'])
        }
        if (tokenHashes.length) {
            let tokens = await Token.find({ hash: { $in: tokenHashes } })
            for (let i = 0; i < items.length; i++) {
                for (let j = 0; j < tokens.length; j++) {
                    if (items[i]['address'] === tokens[j]['hash']) {
                        items[i].symbol = (typeof tokens[j]['symbol'] !== 'undefined')
                            ? tokens[j]['symbol']
                            : null
                    }
                }
            }
        }

        // Append blockTime to TokenTx.
        let blockNumbers = []
        for (let i = 0; i < items.length; i++) {
            blockNumbers.push(items[i]['blockNumber'])
        }
        if (blockNumbers.length) {
            let blocks = await Block.find({ number: { $in: blockNumbers } })
            for (let i = 0; i < items.length; i++) {
                for (let j = 0; j < blocks.length; j++) {
                    if (items[i]['blockNumber'] === blocks[j]['number']) {
                        items[i].blockTime = (typeof blocks[j]['timestamp'] !==
                            'undefined')
                            ? blocks[j]['timestamp']
                            : null
                    }
                }
            }
        }

        return items
    }
}

export default TokenTransactionHelper
