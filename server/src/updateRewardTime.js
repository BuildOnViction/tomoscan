import Web3Util from './helpers/web3'
const db = require('./models')
const config = require('config')

async function RewardProcess () {
    const web3 = await Web3Util.getWeb3()
    let lastReward = await db.Reward.find().sort({ epoch: -1 }).limit(1)
    let lastEpoch = null
    if (lastReward) {
        lastEpoch = lastReward[0].epoch
    }
    console.log('Total epoch:', lastEpoch)
    if (lastEpoch !== null) {
        for (let epoch = 1; epoch <= lastEpoch; epoch++) {
            let blockRewardCalculate = (epoch + 1) * config.get('BLOCK_PER_EPOCH')

            let block = await db.Block.findOne({ number: blockRewardCalculate })
            let timestamp = null
            if (!block) {
                let _block = await web3.eth.getBlock(blockRewardCalculate)
                if (_block) {
                    timestamp = _block.timestamp * 1000
                }
            } else {
                timestamp = block.timestamp
            }
            if (timestamp !== null) {
                await db.Reward.update({ epoch: epoch }, { $set: { rewardTime: timestamp } }, { multi: true })
            }
            console.log('Update reward time of epoch: ', epoch, timestamp)
        }
    }
}
async function run () {
    console.log('Start process', new Date())
    console.log('------------------------------------------------------------------------')
    await RewardProcess()
    console.log('------------------------------------------------------------------------')
    console.log('End process', new Date())
    process.exit(1)
}

run()
