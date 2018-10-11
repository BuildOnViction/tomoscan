const db = require('./models')
const config = require('config')
import TokenHolderHelper from './helpers/tokenHolder'
import BigNumber from "bignumber.js";

async function RemoveProcess (revertToBlock) {
    let lastBlockOnDb = await db.Block.find().sort({ number: -1 }).limit(1)
    let lastBlock = lastBlockOnDb[0].number || null
    console.log('last block: ', lastBlock, 'revert to block: ', revertToBlock)

    if (lastBlock !== null && lastBlock > revertToBlock) {
        console.log('Total block:', parseFloat(lastBlock) - parseFloat(revertToBlock))
        for (let b = revertToBlock; b <= lastBlock; b++) {
            console.log('Process block: ', b)

            // Delete reward
            if (b % config.get('BLOCK_PER_EPOCH') === 0) {
                await db.Reward.deleteMany({ epoch: ( b / config.get('BLOCK_PER_EPOCH')) })
            }

            // Delete block
            await db.Block.findOneAndDelete({ blockNumber: b })

            let txIdes = []

            let txes = await db.Tx.find({blockNumber: b})
            for (let i = 0; i < txes.length; i++) {
                let tx = txes[i]
                // Delete everything about token create in this block
                if (tx.contractAddress) {
                    await db.Account.findOneAndDelete({hash: tx.contractAddress})
                    await db.Contract.findOneAndDelete({hash: tx.contractAddress})
                    await db.Token.findOneAndDelete({hash: tx.contractAddress})
                    await db.TokenHolder.findOneAndDelete({hash: tx.contractAddress})
                    await db.TokenHolder.findOneAndDelete({token: tx.contractAddress})
                    await db.TokenInfo.findOneAndDelete({hash: tx.contractAddress})
                    await db.TokenTx.findOneAndDelete({address: tx.contractAddress})
                }
                txIdes.push(tx.hash)

            }

            // Modify token holder amount
            if (txIdes){
                let tokenTx = await db.TokenTx.find({transactionHash: {$in: txIdes}})
                for (let i = 0; i < tokenTx.length; i++) {
                    let tx = tokenTx[i]
                    await TokenHolderHelper.updateQuality(tx.to, tx.address, new BigNumber(tx.value).multipliedBy(-1))
                    await TokenHolderHelper.updateQuality(tx.from, tx.address, new BigNumber(tx.value))
                }

                await db.Tx.deleteMany({ blockNumber: b })
            }
        }
    }
}
async function run () {
    console.log('Start process', new Date())
    console.log('------------------------------------------------------------------------')
    await RemoveProcess(1710800)
    console.log('------------------------------------------------------------------------')
    console.log('End process', new Date())
    process.exit(1)
}

run()
