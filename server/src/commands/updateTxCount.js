const db = require('../models')

async function AccountProcess () {
    const accounts = await db.Account.find()
    console.log('accounts.length:', accounts.length)
    for (let i = 0; i < accounts.length; i++) {
        const account = accounts[i]
        console.log('Process account: ', account.hash, new Date())

        const fromCount = await db.Tx.countDocuments({ from: account.hash })
        const toCount = await db.Tx.countDocuments({ to: account.hash })
        const contractCount = await db.Tx.countDocuments({ contractAddress: account.hash })
        const fromToCount = await db.Tx.countDocuments({ from: account.hash, to: account.hash })
        const txCount = fromCount + toCount + contractCount - fromToCount

        const minedBlock = await db.Block.countDocuments({ signer: account.hash })
        const rewardCount = await db.Reward.countDocuments({ address: account.hash })
        const logCount = await db.Log.countDocuments({ address: account.hash })

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
    const contracts = await db.Contract.find()
    console.log('contracts.length:', contracts.length)
    for (let i = 0; i < contracts.length; i++) {
        const contract = contracts[i]
        console.log('Process contract: ', contract.hash, new Date())

        const fromCount = await db.Tx.countDocuments({ from: contract.hash })
        const toCount = await db.Tx.countDocuments({ to: contract.hash })
        const contractCount = await db.Tx.countDocuments({ contractAddress: contract.hash })
        const fromToCount = await db.Tx.countDocuments({ from: contract.hash, to: contract.hash })
        const txCount = fromCount + toCount + contractCount - fromToCount

        await db.Contract.updateOne({ hash: contract.hash }, { txCount: txCount })
    }
}
async function TokenProcess () {
    const tokens = await db.Token.find()
    console.log('tokens.length:', tokens.length)
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i]
        console.log('Process token: ', token.hash, new Date())

        const txCount = await db.TokenTx.countDocuments({ address: token.hash })

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
