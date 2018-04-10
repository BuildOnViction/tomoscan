import Block from '../models/block'
import Web3Util from '../helpers/web3'
import async from 'async'
import Transaction from '../models/transaction'
import { getSigner, toAddress } from '../helpers/utils'

let BlockRepository = {
  addBlockByNumber: async (number) => {
    let web3 = await Web3Util.getWeb3()
    let _block = await web3.eth.getBlock(number)
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
    _block.s_tx = 0
    _block.signer = signer
    let transactions = _block.transactions
    delete _block['transactions']

    let block = await Block.findOneAndUpdate({number: _block.number}, _block,
      {upsert: true, new: true})
    if (block && transactions.length) {
      // Insert transaction before.
      async.each(transactions, async (tx_hash, next) => {
        await Transaction.findOneAndUpdate({hash: tx_hash},
          {hash: tx_hash, block_id: block}, {upsert: true, new: true})

        next()
      }, (e) => {
        if (e) {
          throw e
        }

        return block
      })
    }

    return block
  },
}

export default BlockRepository