const db = require('../models')

async function getTxes (page, limit) {
    return db.Tx.find().limit(limit).skip((page - 1) * limit)
}
async function getReward (page, limit) {
    return db.Reward.find().limit(limit).skip((page - 1) * limit)
}
async function getInternal (page, limit) {
    return db.InternalTx.find().limit(limit).skip((page - 1) * limit)
}
async function getTokenTx (page, limit) {
    return db.TokenTx.find().limit(limit).skip((page - 1) * limit)
}
async function getMine (page, limit) {
    return db.Block.find().limit(limit).skip((page - 1) * limit)
}

const limit = 200
async function countTX () {
    let page = 1
    let txes = await getTxes(page, limit)

    while (txes.length > 0) {
        console.log('Process tx page %s', page)
        let map = txes.map(async (tx) => {
            await db.Account.updateOne({ hash: tx.to }, { $inc : { inTxCount: 1, totalTxCount: 1 } }, { upsert: true })
            await db.Account.updateOne(
                { hash: tx.from }, { $inc : { outTxCount: 1, totalTxCount: 1 } }, { upsert: true })
        })
        await Promise.all(map)
        page += 1
        txes = await getTxes(page, limit)
    }
}

async function countReward () {
    let page = 1
    let rws = await getReward(page, limit)

    while (rws.length > 0) {
        console.log('Process reward page %s', page)
        let map = rws.map(async (rw) => {
            await db.Account.updateOne({ hash: rw.address }, { $inc: { rewardCount: 1 } }, { upsert: true })
        })
        await Promise.all(map)
        page += 1
        rws = await getReward(page, limit)
    }
}

async function countInternal () {
    let page = 1
    let its = await getInternal(page, limit)

    while (its.length > 0) {
        console.log('Process internal page %s', page)
        let map = its.map(async (it) => {
            await db.Account.updateOne({ hash: it.from }, { $inc: { internalTxCount: 1 } }, { upsert: true })
            await db.Account.updateOne({ hash: it.to }, { $inc: { internalTxCount: 1 } }, { upsert: true })
        })
        await Promise.all(map)
        page += 1
        its = await getInternal(page, limit)
    }
}

async function countTokenTx () {
    let page = 1
    let its = await getTokenTx(page, limit)

    while (its.length > 0) {
        console.log('Process token tx page %s', page)
        let map = its.map(async (it) => {
            await db.Account.updateOne({ hash: it.from }, { $inc: { tokenTxCount: 1 } }, { upsert: true })
            await db.Account.updateOne({ hash: it.to }, { $inc: { tokenTxCount: 1 } }, { upsert: true })
        })
        await Promise.all(map)
        page += 1
        its = await getTokenTx(page, limit)
    }
}

async function countMine () {
    let page = 1
    let its = await getMine(page, limit)

    while (its.length > 0) {
        console.log('Process mine page %s', page)
        let map = its.map(async (it) => {
            await db.Account.updateOne({ hash: it.signer }, { $inc: { minedBlock: 1 } }, { upsert: true })
        })
        await Promise.all(map)
        page += 1
        its = await getMine(page, limit)
    }
}

const counting = async () => {
    await db.Account.update({}, { $set: {
        inTxCount: 0,
        outTxCount: 0,
        totalTxCount: 0,
        internalTxCount: 0,
        tokenTxCount: 0,
        minedBlock: 0,
        rewardCount: 0,
        logCount: 0
    } })
    await Promise.all([
        countMine(),
        countTokenTx(),
        countInternal(),
        countReward(),
        countTX()
    ])
    console.log('Finish')
    process.exit(0)
}

module.exports = { counting }
