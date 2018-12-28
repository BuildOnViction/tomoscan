const RewardHelper = require('../helpers/reward')
const logger = require('../helpers/logger')
const epochReward = async (epoch) => {
    logger.info('Start calculate reward epoch %s at %s', epoch, new Date())
    await RewardHelper.rewardOnChain(epoch)
    logger.info('Finish calculate reward epoch %s at %s', epoch, new Date())
    process.exit(0)
}

module.exports = { epochReward }
