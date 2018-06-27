import Block from '../models/Block'
import Tx from '../models/Tx'
import _ from 'lodash'

let LogRepository = {
    getFunctionHashes () {
        return {
            'allowance(address,address)': 'dd62ed3e',
            'approve(address,uint256)': '095ea7b3',
            'balanceOf(address)': '70a08231',
            'decimals()': '313ce567',
            'name()': '06fdde03',
            'symbol()': '95d89b41',
            'totalSupply()': '18160ddd',
            'transfer(address,uint256)': 'a9059cbb',
            'transferFrom(address,address,uint256)': '23b872dd',
            'Transfer(address,address,uint256)': 'ddf252ad',
            'Approval(address,address,uint256)': '8c5be1e5',
            'version()': '54fd4d50'
        }
    },

    async formatItem (log) {
        let block = await Block.findOne({ number: log.blockNumber })
        let tx = await Tx.findOne({ hash: log.transactionHash.toLowerCase() })

        log.block = block
        log.tx = tx
        log.methodCode = tx ? tx.input.substring(0, 10) : ''
        let code = log.methodCode.replace('0x', '')
        let funcs = LogRepository.getFunctionHashes()
        log.methodName = await _.findKey(funcs, (value, key) => value === code)

        return log
    }
}

export default LogRepository
