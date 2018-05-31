import Web3Util from '../helpers/web3'
import BlockRepository from '../repositories/BlockRepository'
import TxRepository from '../repositories/TxRepository'
import Block from '../models/Block'

let Web3Connector = {
  connect: async (io) => {
    try {
      io.on('connection', async (socket) => {
        let web3WS = await Web3Util.getWeb3Socket()

        web3WS.eth.subscribe('newBlockHeaders').
          on('data', async (_block) => {
            if (_block) {
              let block = await Block.findOne(
                {number: _block.number})
              // Insert new block into db.
              if (!block) {
                block = await BlockRepository.addBlockByNumber(_block.number)
              }

//              socket.emit('new__block', block)
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