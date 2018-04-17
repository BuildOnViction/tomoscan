import Web3Util from '../helpers/web3'
import BlockRepository from '../repositories/BlockRepository'
import TxRepository from '../repositories/TxRepository'

let Web3Connector = {
  connect: async () => {
    try {
      let web3WS = await Web3Util.getWeb3Socket()

      web3WS.eth.subscribe('newBlockHeaders').
        on('data', async (block) => {
          if (block) {
            // Insert new block into db.
            await BlockRepository.addBlockByNumber(block.number,
              false, true)
          }
        })

      web3WS.eth.subscribe('pendingTransactions').
        on('data', async (tx_hash) => {
          // Insert pending transaction into db.
          await TxRepository.getTxDetail(tx_hash)
        })
    }
    catch (e) {
      console.log(e)
      throw e
    }
  },
}

export default Web3Connector