import Block from '../models/Block'
import Web3Util from '../helpers/web3'
import async from 'async'
import Transaction from '../models/Tx'
import { getSigner, toAddress } from '../helpers/utils'
import TxRepository from './TxRepository'

let BlockRepository = {
  addBlockByNumber: async (number, add_tx = true) => {
    let block = await Block.findOne({number: number, nonce: {$exists: true}})
    if (block) {
      return block
    }

    let web3 = await Web3Util.getWeb3()
    let _block = await web3.eth.getBlock(number, true)
    if (!_block) {
      return false
    }

    // Get signer.
    let signer = toAddress(getSigner(_block), 100)

    // Update end tx count.
    let end_tx_count = await web3.eth.getBlockTransactionCount(_block.hash)
    _block.timestamp = _block.timestamp * 1000
    _block.e_tx = end_tx_count
    _block.c_tx = false
    _block.signer = signer
    let txs = _block.transactions
    delete _block['transactions']

    block = await Block.findOneAndUpdate({number: _block.number}, _block,
      {upsert: true, new: true})
    if (add_tx && block && txs.length) {
      await TxRepository.addTxsFromBlock(block, txs)
    }

    return block
  },
}

export default BlockRepository