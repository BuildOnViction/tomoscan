import Block from '../models/Block'
import Web3Util from '../helpers/web3'
import Tx from '../models/Tx'
import { getSigner, toAddress } from '../helpers/utils'
import TxRepository from './TxRepository'
import async from 'async'

let BlockRepository = {
  addBlockByNumber: async (
    number, add_tx = true, update_block_numb = false) => {
    let block = await Block.findOne({number: number, nonce: {$exists: true}})
    let count_tx = await Tx.find({blockNumber: number}).count()
    if (block && count_tx == block.e_tx) {
      return block
    }

    let web3 = await Web3Util.getWeb3()
    let tx_objects = update_block_numb ? false : true
    let _block = await web3.eth.getBlock(number, tx_objects)

    // Get signer.
    let signer = toAddress(getSigner(_block), 100)

    // Update end tx count.
    let end_tx_count = await web3.eth.getBlockTransactionCount(_block.hash)
    _block.timestamp = _block.timestamp * 1000
    _block.e_tx = end_tx_count
    _block.signer = signer
    let txs = _block.transactions
    delete _block['transactions']

    block = await Block.findOneAndUpdate({number: _block.number}, _block,
      {upsert: true, new: true})
    if (add_tx && block && txs.length) {
      if (!update_block_numb) {
        // Sync txs.
        let tx_count = Tx.find({blockNumber: block.number}).count()
        if (tx_count != block.e_tx) {
          // Insert transaction before.
          async.each(txs, async (tx, next) => {
            if (block) {
              tx.block_id = block
            }
            tx.crawl = false
            await Tx.findOneAndUpdate({hash: tx.hash}, tx,
              {upsert: true, new: true,},
            )

            next()
          }, (e) => {
            if (e) {
              throw e
            }
          })
        }
      }
      else {
        // Update block number for txs pending.
        await TxRepository.updateBlockForTxs(block, txs)
      }
    }

    return block
  },
}

export default BlockRepository