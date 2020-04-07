const TokenHolderHelper = require('../helpers/tokenHolder')
const BigNumber = require('bignumber.js')
const db = require('../models')
const config = require('config')

const revert = async (revertToBlock) => {
    const lastBlockOnDb = await db.Block.find().sort({ number: -1 }).limit(1)
    const lastBlock = lastBlockOnDb[0].number || null
    console.info('last block: ', lastBlock, 'revert to block: ', revertToBlock)

    await db.Setting.updateOne({ meta_key: 'min_block_crawl' }, { meta_value: revertToBlock })

    if (lastBlock !== null && lastBlock > revertToBlock) {
        console.info('Total block:', parseFloat(lastBlock) - parseFloat(revertToBlock))
        for (let b = revertToBlock; b <= lastBlock; b++) {
            // Delete block
            console.info('- Delete block', b, new Date())
            await db.Block.findOneAndDelete({ number: b })

            // Delete reward
            if (b % config.get('BLOCK_PER_EPOCH') === 0) {
                const epoch = b / config.get('BLOCK_PER_EPOCH')
                console.info('  Delete reward of epoch ', epoch, new Date())
                await db.Reward.deleteMany({ epoch: epoch })
            }

            const txIdes = []

            const txes = await db.Tx.find({ blockNumber: b })
            for (let i = 0; i < txes.length; i++) {
                const tx = txes[i]
                // Delete everything about token create in this block
                if (tx.contractAddress) {
                    console.info('  Delete everything about contract ', tx.contractAddress, new Date())
                    await db.Account.findOneAndDelete({ hash: tx.contractAddress })
                    await db.Contract.findOneAndDelete({ hash: tx.contractAddress })
                    await db.Token.findOneAndDelete({ hash: tx.contractAddress })
                    await db.TokenHolder.findOneAndDelete({ hash: tx.contractAddress })
                    await db.TokenHolder.findOneAndDelete({ token: tx.contractAddress })
                    await db.TokenInfo.findOneAndDelete({ hash: tx.contractAddress })
                    await db.TokenTx.findOneAndDelete({ address: tx.contractAddress })
                }
                txIdes.push(tx.hash)
            }

            // Modify token holder amount
            if (txIdes.length) {
                const tokenTx = await db.TokenTx.find({ transactionHash: { $in: txIdes } })
                console.info('  Delete token', tokenTx.length, ' transactions & revert token balance')
                for (let i = 0; i < tokenTx.length; i++) {
                    const tx = tokenTx[i]
                    await TokenHolderHelper.updateQuality(tx.to, tx.address, new BigNumber(tx.value).multipliedBy(-1))
                    await TokenHolderHelper.updateQuality(tx.from, tx.address, new BigNumber(tx.value))
                }

                console.info('  Delete', txIdes.length, 'transactions')
                await db.Tx.deleteMany({ blockNumber: b })
            }
        }
        process.exit(1)
    }
}

module.exports = { revert }
