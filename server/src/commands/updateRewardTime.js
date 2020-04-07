const Web3Util = require('../helpers/web3')
const db = require('../models')
const config = require('config')

const RewardProcess = async () => {
    const web3 = await Web3Util.getWeb3()
    const lastReward = await db.Reward.find().sort({ epoch: -1 }).limit(1)
    let lastEpoch = null
    if (lastReward) {
        lastEpoch = lastReward[0].epoch
    }
    console.info('Total epoch:', lastEpoch)
    console.info('Process at', new Date())
    if (lastEpoch !== null) {
        for (let epoch = 1; epoch <= lastEpoch; epoch++) {
            const blockRewardCalculate = (epoch + 1) * config.get('BLOCK_PER_EPOCH')

            const block = await db.Block.findOne({ number: blockRewardCalculate })
            let timestamp = null
            if (!block) {
                const _block = await web3.eth.getBlock(blockRewardCalculate)
                if (_block) {
                    timestamp = _block.timestamp * 1000
                }
            } else {
                timestamp = block.timestamp
            }
            if (timestamp !== null) {
                await db.Reward.update({ epoch: epoch }, { $set: { rewardTime: timestamp } }, { multi: true })
            }
            console.info('Update reward time of epoch: ', epoch, timestamp)
        }
    }

    console.info('Finish at', new Date())
    process.exit(1)
}

module.exports = { RewardProcess }
