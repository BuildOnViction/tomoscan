import Web3Util from '../helpers/web3'
import BlockRepository from '../repositories/BlockRepository'

let Web3Connector = {
  connect: async () => {
    let web3WS = await Web3Util.getWeb3Socket()

    let s = web3WS.eth.subscribe('newBlockHeaders').
      on('data', async (block) => {
        if (block) {
          // Insert new block into db.
          let _block = await BlockRepository.addBlockByNumber(block.number)
        }
      })
  },
}

export default Web3Connector