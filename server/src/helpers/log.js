const db = require('../models')
const _ = require('lodash')

let LogHelper = {
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

    async formatLog (log) {
        let block = await db.Block.findOne({ number: log.blockNumber })
        let tx = await db.Tx.findOne({ hash: log.transactionHash.toLowerCase() })

        log.block = block
        log.tx = tx
        log.methodCode = tx ? tx.input.substring(0, 10) : ''
        let code = log.methodCode.replace('0x', '')
        let funcs = LogHelper.getFunctionHashes()
        log.methodName = await _.findKey(funcs, (value, key) => value === code)

        return log
    }
}

module.exports = LogHelper
