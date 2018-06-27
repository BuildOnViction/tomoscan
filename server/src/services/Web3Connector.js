import Web3Util from '../helpers/web3'
import cache from 'memory-cache'

let Web3Connector = {
    connect: async (io) => {
        try {
            io.on('connection', async (socket) => {
                let web3WS = await Web3Util.getWeb3Socket()

                if (!web3WS) {
                    return false
                }

                web3WS.eth.subscribe('newBlockHeaders').on('data', async (_block) => {
                    if (_block) {
                        let cacheNumber = cache.get('cacheNumber')

                        // Check only add block once.
                        if (cacheNumber && cacheNumber >= parseInt(_block.number)) {
                            return
                        }
                        cache.put('cacheNumber', _block.number)
                    }
                })
            })
        } catch (e) {
            console.trace(e)
            return null
        }
    }
}

export default Web3Connector
