import Web3Util from '../helpers/web3'
import BlockRepository from '../repositories/BlockRepository'
import TransactionRepository from '../repositories/TransactionRepository'

let Web3Connector = {
  connect: async () => {
    try {
      let web3WS = await Web3Util.getWeb3Socket()

      web3WS.eth.subscribe('newBlockHeaders').
        on('data', async (block) => {
          if (block) {
            // Insert new block into db.
            let _block = await BlockRepository.addBlockByNumber(block.number,
              false)
            let txs = block.transactions
            await TransactionRepository.updateBlockForTxs(_block, txs)
          }
        })

      web3WS.eth.subscribe('pendingTransactions').
        on('data', async (tx_hash) => {
          // Insert pending transaction into db.
          await TransactionRepository.getTxDetail(tx_hash)
        })
    }
    catch (e) {
      console.log(e)
      throw e
    }
  },
}

export default Web3Connector