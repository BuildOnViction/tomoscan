const Web3Util = require('./web3')
const BigNumber = require('bignumber.js')
const utils = require('./utils')
const db = require('../models')
const logger = require('./logger')
const elastic = require('./elastic')
const DEFAULT_ABI = [
    {
        constant: true,
        inputs: [
            {
                name: 'tokenOwner',
                type: 'address'
            }
        ],
        name: 'balanceOf',
        outputs: [
            {
                name: 'balance',
                type: 'uint256'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    },
    {
        constant: true,
        inputs: [
            {
                name: 'tokenOwner',
                type: 'address'
            },
            {
                name: 'spender',
                type: 'address'
            }
        ],
        name: 'allowance',
        outputs: [
            {
                name: 'remaining',
                type: 'uint256'
            }
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function'
    }
]

const TokenHelper = {
    getTokenFuncs: async () => ({
        decimals: '0x313ce567', // hex to decimal
        symbol: '0x95d89b41', // hex to ascii
        totalSupply: '0x18160ddd',
        transfer: '0xa9059cbb',
        name: '0x06fdde03'
    }),

    checkTokenType: async (code) => {
        const trc20Function = {
            totalSupply: '0x18160ddd',
            balanceOf: '0x70a08231',
            allowance: '0xdd62ed3e',
            transfer: '0xa9059cbb',
            approve: '0x095ea7b3',
            transferFrom: '0x23b872dd',
            Transfer: '0xddf252ad',
            Approval: '0x8c5be1e5',
            name: '0x06fdde03',
            symbol: '0x95d89b41',
            decimals: '0x313ce567'
        }
        const trc721Function = {
            Transfer: '0xddf252ad',
            Approval: '0x8c5be1e5',
            ApprovalForAll: '0x17307eab',
            balanceOf: '0x70a08231',
            ownerOf: '0x6352211e',
            safeTransferFrom1: '0xb88d4fde',
            safeTransferFrom: '0x42842e0e',
            transferFrom: '0x23b872dd',
            approve: '0x095ea7b3',
            // 'setApprovalForAll': '0xa22cb465',
            getApproved: '0x081812fc',
            // 'isApprovedForAll': '0x7070ce33',
            supportsInterface: '0x01ffc9a7',
            totalSupply: '0x18160ddd'
        }
        const trc21Function = {
            totalSupply: '0x18160ddd',
            balanceOf: '0x70a08231',
            estimateFee: '0x127e8e4d',
            issuer: '0x1d143848',
            allowance: '0xdd62ed3e',
            transfer: '0xa9059cbb',
            approve: '0x095ea7b3',
            transferFrom: '0x23b872dd',
            Transfer: '0xddf252ad',
            Approval: '0x8c5be1e5',
            Fee: '0xfcf5b327',
            name: '0x06fdde03',
            symbol: '0x95d89b41',
            decimals: '0x313ce567',
            minFee: '0x24ec7590'
        }

        let isTrc21 = true
        for (const trc21 in trc21Function) {
            let codeCheck = trc21Function[trc21]
            codeCheck = codeCheck.replace('0x', '')
            if (code.indexOf(codeCheck) < 0) {
                isTrc21 = false
                break
            }
        }
        if (isTrc21) {
            return 'trc21'
        }

        let isTrc20 = true
        for (const trc20 in trc20Function) {
            let codeCheck = trc20Function[trc20]
            codeCheck = codeCheck.replace('0x', '')
            if (code.indexOf(codeCheck) < 0) {
                isTrc20 = false
                break
            }
        }
        if (isTrc20) {
            return 'trc20'
        }

        let isTrc721 = true
        for (const trc721 in trc721Function) {
            let codeCheck = trc721Function[trc721]
            codeCheck = codeCheck.replace('0x', '')
            if (code.indexOf(codeCheck) < 0) {
                isTrc721 = false
                break
            }
        }
        if (isTrc721) {
            return 'trc721'
        }
        return 'other'
    },

    checkIsToken:async (code) => {
        const tokenFuncs = await TokenHelper.getTokenFuncs()
        for (const name in tokenFuncs) {
            let codeCheck = tokenFuncs[name]
            codeCheck = codeCheck.replace('0x', '')
            if (code.indexOf(codeCheck) >= 0) {
                return true
            }
        }

        return false
    },
    checkMintable: async (code) => {
        // mint(address,uint256)
        const mintFunction = '0x40c10f19'.replace('0x', '')
        if (code.indexOf(mintFunction) >= 0) {
            return true
        }
        return false
    },

    formatToken: async (item) => {
        item.name = await utils.formatAscIIJSON(item.name)
        item.symbol = await utils.formatAscIIJSON(item.symbol)

        return item
    },

    getTokenBalance: async (token, holder) => {
        const web3 = await Web3Util.getWeb3()
        const web3Contract = new web3.eth.Contract(DEFAULT_ABI, token.hash)
        if (holder === '0x0000000000000000000000000000000000000000') {
            return { quantity: '0', quantityNumber: 0 }
        }
        const result = await web3Contract.methods.balanceOf(holder).call()

        const quantity = new BigNumber(await web3.utils.hexToNumberString(result.balance))
        const quantityNumber = quantity.dividedBy(10 ** token.decimals).toNumber()
        return { quantity: quantity.toString(10), quantityNumber: quantityNumber }
    },

    updateTokenInfo: async (tokenAddress) => {
        const token = await db.Token.findOneAndUpdate({ hash: tokenAddress },
            { hash: tokenAddress }, { upsert: true, new: true })
        const tokenFuncs = await TokenHelper.getTokenFuncs()

        const web3 = await Web3Util.getWeb3()

        if (!token.name) {
            let name = await web3.eth.call({ to: token.hash, data: tokenFuncs.name })
            name = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(name))
            token.name = name
        }

        if (!token.symbol) {
            let symbol = await web3.eth.call({ to: token.hash, data: tokenFuncs.symbol })
            symbol = await utils.removeXMLInvalidChars(await web3.utils.toUtf8(symbol))
            token.symbol = symbol
        }

        if (!token.decimals) {
            let decimals = await web3.eth.call({ to: token.hash, data: tokenFuncs.decimals })
            decimals = await web3.utils.hexToNumberString(decimals)
            token.decimals = decimals
        }

        if (!token.txCount) {
            token.txCount = 0
        }

        // Check token type
        const code = await web3.eth.getCode(tokenAddress)
        token.type = await TokenHelper.checkTokenType(code)
        token.isMintable = await TokenHelper.checkMintable(code)

        let totalSupply = await web3.eth.call({ to: token.hash, data: tokenFuncs.totalSupply })
        totalSupply = await web3.utils.hexToNumberString(totalSupply).trim()
        token.totalSupply = totalSupply
        token.totalSupplyNumber = new BigNumber(totalSupply).div(10 ** parseInt(token.decimals))

        token.status = true
        await token.save()

        const t = token.toJSON()
        delete t._id
        delete t.id
        t.totalSupplyNumber = String(t.totalSupplyNumber)
        try {
            await elastic.deleteByQuery('tokens', { match: { hash: t.hash } })
        } catch (e) {
            logger.warn('no have index to delete')
        }
        await elastic.index(t.hash, 'tokens', {
            decimals: token.decimals,
            hash: token.hash,
            isMintable: token.isMintable,
            name: token.name,
            symbol: token.symbol,
            totalSupply: token.totalSupply,
            totalSupplyNumber: token.totalSupplyNumber,
            type: token.type
        })
    }
}

module.exports = TokenHelper
