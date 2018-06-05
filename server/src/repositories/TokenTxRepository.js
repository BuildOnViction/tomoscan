import Token from '../models/Token'
import Block from '../models/Block'
import web3 from 'web3'
import { unformatAddress } from '../helpers/utils'
import TokenTx from '../models/TokenTx'
import TokenHolderRepository from './TokenHolderRepository'

let TokenTxRepository = {
  async addTokenTxFromLog (log) {
    let _log = log
    if (typeof log.topics[1] == 'undefined' ||
      typeof log.topics[2] == 'undefined') {
      return false
    }

    if (log.topics[1]) {
      _log.from = unformatAddress(log.topics[1])
    }
    if (log.topics[2]) {
      _log.to = unformatAddress(log.topics[2])
    }
    _log.value = web3.utils.hexToNumberString(log.data)
    _log.valueNumber = _log.value
    // Find block by blockNumber.
    let block = await Block.findOne({number: _log.blockNumber})
    if (block) {
      _log.block = block
    }
    _log.address = _log.address.toLowerCase()
    let transactionHash = _log.transactionHash.toLowerCase()

    delete _log['_id']

    let tokenTx = await TokenTx.findOneAndUpdate(
      {transactionHash: transactionHash, from: _log.from, to: _log.to},
      _log,
      {upsert: true, new: true})

    // Add token holder data.
    await TokenHolderRepository.addHoldersFromTokenTx(tokenTx)

    return tokenTx
  },

  async formatItems (items) {
    // Append token for each TokenTx.
    let tokenHashes = []
    for (let i = 0; i < items.length; i++) {
      tokenHashes.push(items[i]['address'])
    }
    if (tokenHashes.length) {
      let tokens = await Token.find({hash: {$in: tokenHashes}})
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
      let blocks = await Block.find({number: {$in: blockNumbers}})
      for (let i = 0; i < items.length; i++) {
        for (let j = 0; j < blocks.length; j++) {
          if (items[i]['blockNumber'] == blocks[j]['number']) {
            items[i].blockTime = (typeof blocks[j]['timestamp'] !==
              'undefined')
              ? blocks[j]['timestamp']
              : null
          }
        }
      }
    }

    return items
  },
}

export default TokenTxRepository