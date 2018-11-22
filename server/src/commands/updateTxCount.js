const db = require('../models')

async function AccountProcess () {
    let accounts = await db.Account.find()
    console.log('accounts.length:', accounts.length)
    for (let i = 0; i < accounts.length; i++) {
        let account = accounts[i]
        console.log('Process account: ', account.hash, new Date())

        let fromCount = await db.Tx.countDocuments({ from: account.hash })
        let toCount = await db.Tx.countDocuments({ to: account.hash })
        let contractCount = await db.Tx.countDocuments({ contractAddress: account.hash })
        let fromToCount = await db.Tx.countDocuments({ from: account.hash, to: account.hash })
        let txCount = fromCount + toCount + contractCount - fromToCount

        let minedBlock = await db.Block.countDocuments({ signer: account.hash })
        let rewardCount = await db.Reward.countDocuments({ address: account.hash })
        let logCount = await db.Log.countDocuments({ address: account.hash })

        await db.Account.updateOne({ hash: account.hash },
            {
                transactionCount: txCount,
                minedBlock: minedBlock,
                rewardCount: rewardCount,
                logCount: logCount
            })
    }
}

async function ContractProcess () {
    let contracts = await db.Contract.find()
    console.log('contracts.length:', contracts.length)
    for (let i = 0; i < contracts.length; i++) {
        let contract = contracts[i]
        console.log('Process contract: ', contract.hash, new Date())

        let fromCount = await db.Tx.countDocuments({ from: contract.hash })
        let toCount = await db.Tx.countDocuments({ to: contract.hash })
        let contractCount = await db.Tx.countDocuments({ contractAddress: contract.hash })
        let fromToCount = await db.Tx.countDocuments({ from: contract.hash, to: contract.hash })
        let txCount = fromCount + toCount + contractCount - fromToCount

        await db.Contract.updateOne({ hash: contract.hash }, { txCount: txCount })
    }
}
async function TokenProcess () {
    let tokens = await db.Token.find()
    console.log('tokens.length:', tokens.length)
    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i]
        console.log('Process token: ', token.hash, new Date())

        let txCount = await db.TokenTx.countDocuments({ address: token.hash })

        await db.Token.updateOne({ hash: token.hash }, { txCount: txCount })
    }
}

const updateTxCount = async () => {
    console.log('Start process', new Date())
    console.log('------------------------------------------------------------------------')
    await AccountProcess()
    console.log('------------------------------------------------------------------------')
    await ContractProcess()
    console.log('------------------------------------------------------------------------')
    await TokenProcess()
    console.log('------------------------------------------------------------------------')
    console.log('End process', new Date())
    process.exit(1)
}

module.exports = { updateTxCount }
