const config = require('config')
const axios = require('axios')
const contractAddress = require('../contracts/contractAddress')
const db = require('../models')

const updateSpecialAccount = async () => {
    console.log('Count list transaction')
    await db.SpecialAccount.updateOne({ hash: 'allTransaction' }, {
        transactionCount: await db.Tx.countDocuments({ isPending: false })
    }, { upsert: true })
    await db.SpecialAccount.updateOne({ hash: 'pendingTransaction' }, {
        transactionCount: await db.Tx.countDocuments({ isPending: true })
    }, { upsert: true })
    await db.SpecialAccount.updateOne({ hash: 'signTransaction' }, {
        transactionCount: await db.Tx.countDocuments({ to: contractAddress.BlockSigner, isPending: false })
    }, { upsert: true })
    await db.SpecialAccount.updateOne({ hash: 'otherTransaction' }, {
        transactionCount: await db.Tx.countDocuments({ to: { $ne: contractAddress.BlockSigner }, isPending: false })
    }, { upsert: true })

    const tomomasterUrl = config.get('TOMOMASTER_API_URL')
    const candidates = await axios.get(tomomasterUrl + '/api/candidates')
    console.log('there are %s candidates need process', candidates.data.length)
    let map1 = candidates.data.map(async (candidate) => {
        let hash = candidate.candidate.toLowerCase()
        console.log('process candidate', hash)
        let txCount = await db.Tx.countDocuments({ $or: [{ from: hash }, { to: hash }] })
        let minedBlock = await db.Block.countDocuments({ signer: hash })
        let rewardCount = await db.Reward.countDocuments({ address: candidate.owner.toLowerCase() })
        await db.SpecialAccount.updateOne({ hash: hash }, {
            transactionCount: txCount,
            minedBlock: minedBlock
        }, { upsert: true })
        await db.SpecialAccount.updateOne({ hash: candidate.owner.toLowerCase() }, {
            rewardCount: rewardCount
        }, { upsert: true })
    })
    await Promise.all(map1)

    let accounts = await db.Account.find({ isContract: true })
    console.log('there are %s contract accounts', accounts.length)
    let map2 = accounts.map(async (acc) => {
        let hash = acc.hash.toLowerCase()
        console.log('process account', hash)
        let txCount = await db.Tx.countDocuments({ from: hash })
        txCount += await db.Tx.countDocuments({ to: hash })
        txCount += await db.Tx.countDocuments({ contractAddress: hash })
        let logCount = await db.Log.countDocuments({ address: hash })
        await db.SpecialAccount.updateOne({ hash: hash }, {
            transactionCount: txCount,
            logCount: logCount
        }, { upsert: true })
    })
    await Promise.all(map2)
    process.exit(1)
}

module.exports = { updateSpecialAccount }
