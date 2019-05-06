const TokenHelper = require('../helpers/token')

const Web3Util = require('../helpers/web3')
const BigNumber = require('bignumber.js')

const db = require('../models')
const tokenQuantity = async () => {
    async function getTokenHolders (page, limit) {
        return db.TokenHolder.find().limit(limit).skip((page - 1) * limit)
    }
    let page = 1
    let limit = 20
    let tokenHolders = await getTokenHolders(page, limit)
    console.log('%s. Process %s/4.8k token holder', page, limit * page)
    while (tokenHolders.length > 0) {
        let map = tokenHolders.map(async function (th) {
            console.log('   process token %s, holder %s', th.token, th.hash)
            let contract = await db.Contract.findOne({ hash: th.token })
            if (contract) {
                let abiObject = JSON.parse(contract.abiCode)
                let web3 = await Web3Util.getWeb3()
                let web3Contract = new web3.eth.Contract(abiObject, contract.hash)

                let rs = await web3Contract.methods.balanceOf(th.hash).call()
                let quantity = new BigNumber(rs)
                let token = await db.Token.findOne({ hash: th.token })
                let decimals
                if (token) {
                    decimals = token.decimals
                } else {
                    let web3 = await Web3Util.getWeb3()
                    let tokenFuncs = await TokenHelper.getTokenFuncs()
                    decimals = await web3.eth.call({ to: th.token, data: tokenFuncs['decimals'] })
                    decimals = await web3.utils.hexToNumberString(decimals)
                }
                th.quantity = quantity.toString(10)
                th.quantityNumber = quantity.div(10 ** parseInt(decimals)).toNumber()
                await th.save()
            }
        })
        await Promise.all(map)
        page += 1
        tokenHolders = await getTokenHolders(page)
    }
    process.exit(0)
}

module.exports = { tokenQuantity }
