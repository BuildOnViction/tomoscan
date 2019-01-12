const config = require('config')
const axios = require('axios')
const contractAddress = require('../contracts/contractAddress')
const db = require('../models')
const urlJoin = require('url-join')

const updateSpecialAccount = async () => {
    console.info('Count list transaction')
    await db.SpecialAccount.updateOne({ hash: 'allTransaction' }, {
        totalTransactionCount: await db.Tx.countDocuments({ isPending: false })
    }, { upsert: true })
    await db.SpecialAccount.updateOne({ hash: 'pendingTransaction' }, {
        totalTransactionCount: await db.Tx.countDocuments({ isPending: true })
    }, { upsert: true })
    await db.SpecialAccount.updateOne({ hash: 'signTransaction' }, {
        totalTransactionCount: await db.Tx.countDocuments({ to: contractAddress.BlockSigner, isPending: false })
    }, { upsert: true })
    await db.SpecialAccount.updateOne({ hash: 'otherTransaction' }, { totalTransactionCount:
            await db.Tx.countDocuments({ to: { $ne: contractAddress.BlockSigner }, isPending: false })
    }, { upsert: true })

    console.log('count tx for tomochain contract')
    let tomochainContract = []
    for (let c in contractAddress) {
        tomochainContract.push(contractAddress[c])
    }
    for (let i = 0; i < tomochainContract.length; i++) {
        let hash = tomochainContract[i]
        let outTxCount = await db.Tx.countDocuments({ from: hash })
        let inTxCount = await db.Tx.countDocuments({ to: hash })
        let totalTxCount = inTxCount + outTxCount
        let logCount = await db.Log.countDocuments({ address: hash })
        await db.SpecialAccount.updateOne({ hash: hash }, {
            inTransactionCount: inTxCount,
            outTransactionCount: outTxCount,
            totalTransactionCount: totalTxCount,
            logCount: logCount
        }, { upsert: true })
    }

    const tomomasterUrl = config.get('TOMOMASTER_API_URL')
    const candidates = await axios.get(urlJoin(tomomasterUrl, '/api/candidates'))
    console.info('there are %s candidates need process', candidates.data.length)
    let listCan = candidates.data
    for (let i = 0; i < listCan.length; i++) {
        let hash = listCan[i].candidate.toLowerCase()
        console.info('process candidate', hash)
        let txCount = await db.Tx.countDocuments({ $or: [{ from: hash }, { to: hash }], isPending: false })
        let minedBlock = await db.Block.countDocuments({ signer: hash })
        let rewardCount = await db.Reward.countDocuments({ address: hash })
        let logCount = await db.Log.countDocuments({ address: hash })
        await db.SpecialAccount.updateOne({ hash: hash }, {
            totalTransactionCount: txCount,
            minedBlock: minedBlock,
            rewardCount: rewardCount,
            logCount: logCount
        }, { upsert: true })

        // let owner = listCan[i].owner.toLowerCase()
        // let txCountOwner = await db.Tx.countDocuments({ $or: [{ from: owner }, { to: owner }], isPending: false })
        // let minedBlockOwner = await db.Block.countDocuments({ signer: owner })
        // let rewardCountOwner = await db.Reward.countDocuments({ address: owner })
        // let logCountOwner = await db.Log.countDocuments({ address: owner })
        // await db.SpecialAccount.updateOne({ hash: owner }, {
        //     totalTransactionCount: txCountOwner,
        //     minedBlock: minedBlockOwner,
        //     rewardCount: rewardCountOwner,
        //     logCount: logCountOwner
        // }, { upsert: true })
    }

    // let accounts = await db.Account.find({ isContract: true })
    // console.info('there are %s contract accounts', accounts.length)
    // let map2 = accounts.map(async (acc) => {
    //     let hash = acc.hash.toLowerCase()
    //     console.info('process account', hash)
    //     let txCount = await db.Tx.countDocuments({ from: hash, isPending: false })
    //     txCount += await db.Tx.countDocuments({ to: hash, isPending: false })
    //     txCount += await db.Tx.countDocuments({ contractAddress: hash, isPending: false })
    //     let logCount = await db.Log.countDocuments({ address: hash })
    //     await db.SpecialAccount.updateOne({ hash: hash }, {
    //         totalTransactionCount: txCount,
    //         logCount: logCount
    //     }, { upsert: true })
    // })
    // await Promise.all(map2)
    process.exit(1)
}

module.exports = { updateSpecialAccount }
