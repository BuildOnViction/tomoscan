import Web3Util from '../helpers/web3'
import BlockRepository from '../repositories/BlockRepository'
import TxRepository from '../repositories/TxRepository'

let Web3Connector = {
  connect: async (io) => {
    try {

      io.on('connection', async (socket) => {
        let web3WS = await Web3Util.getWeb3Socket()

        web3WS.eth.subscribe('newBlockHeaders').
          on('data', async (_block) => {
            if (_block) {
              // Insert new block into db.
              let block = await BlockRepository.addBlockByNumber(_block.number)

              socket.emit('new__block', block)
            }
          })

//        web3WS.eth.subscribe('pendingTransactions').
//          on('data', async (tx_hash) => {
//            // Insert pending transaction into db.
//            let tx = await TxRepository.getTxPending(tx_hash)
//          })
      })
    }
    catch (e) {
      console.log(e)
      throw e
    }
  },
}

export default Web3Connector