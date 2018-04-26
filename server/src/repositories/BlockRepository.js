import Block from '../models/Block'
import Web3Util from '../helpers/web3'
import Tx from '../models/Tx'
import { getSigner, toAddress } from '../helpers/utils'
import TxRepository from './TxRepository'
import AccountRepository from './AccountRepository'
import Account from '../models/Account'

let BlockRepository = {
  addBlockByNumber: async (number) => {
    let block = await Block.findOne({number: number, nonce: {$exists: true}})
    let countTx = await Tx.find({blockNumber: number}).count()
    if (block && countTx == block.e_tx) {
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
    _block.signer = signer
    let txs = _block.transactions
    delete _block['transactions']
    _block.status = true

    // Update address signer.
    await Account.findOneAndUpdate({hash: signer}, {hash: signer})

    block = await Block.findOneAndUpdate({number: _block.number}, _block,
      {upsert: true, new: true})

    // Sync txs.
    let tx_count = Tx.find({blockNumber: block.number}).count()
    if (tx_count != block.e_tx) {
      // Insert transaction before.
      for (let i = 0; i < txs.length; i++) {
        let tx = txs[i]

        if (tx.hash) {
          if (block) {
            tx.block = block
          }
          tx.status = false
          if (tx && tx.hash) {
            if (tx.from !== null) {
              tx.from_model = await AccountRepository.addAccountPending(tx.from)
            }
            if (tx.to !== null) {
              tx.to_model = await AccountRepository.addAccountPending(tx.to)
            }

            await Tx.findOneAndUpdate({hash: tx.hash}, tx,
              {upsert: true, new: true})
          }
        }
      }
    }

    return block
  },
}

export default BlockRepository