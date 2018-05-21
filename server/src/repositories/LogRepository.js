import Block from '../models/Block'
import Tx from '../models/Tx'

let LogRepository = {
  async formatItem (log) {
    let block = await Block.findOne({number: log.blockNumber})
    let tx = await Tx.findOne({hash: log.transactionHash})

    log.block = block
    log.tx = tx

    return log
  },
}

export default LogRepository