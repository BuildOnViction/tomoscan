const BigNumber = require('bignumber.js')
const db = require('../models')
const config = require('config')
const contractAddress = require('../contracts/contractAddress')
const { tomoValidator, blockSigner } = require('../helpers/tomo')
const RewardHelper = require('../helpers/reward')
const BlockHelper = require('../helpers/block')
const logger = require('../helpers/logger')

const epochReward = async (epoch) => {
    let startBlock = (epoch - 1) * config.get('BLOCK_PER_EPOCH') + 1
    let endBlock = (epoch) * config.get('BLOCK_PER_EPOCH')

    let maxBlockNum = await BlockHelper.getLastBlockNumber()
    if (maxBlockNum - config.get('BLOCK_PER_EPOCH') < endBlock) {
        logger.warn('Epoch %s is waiting for calculate', epoch)
        return
    }
    logger.info('Calculate reward from block %s to block %s', startBlock, endBlock)

    // Delete old reward
    logger.info('Remove old reward of epoch %s', epoch)
    await db.Reward.remove({ epoch: epoch })

    let totalReward = new BigNumber(config.get('REWARD'))
    let validatorRewardPercent = new BigNumber(config.get('MASTER_NODE_REWARD_PERCENT'))
    let foundationRewardPercent = new BigNumber(config.get('FOUNDATION_REWARD_PERCENT'))
    let voterRewardPercent = new BigNumber(config.get('VOTER_REWARD_PERCENT'))

    // Update block signer
    for (let i = startBlock; i <= endBlock; i = i + 50) {
        let its = []
        for (let j = i; j < i + 50; j++) {
            its.push(j)
        }
        logger.info('Update block signer from block %s to block %s', i, i + 49)
        let map = its.map(async (b) => {
            let block = await BlockHelper.getBlock(b)

            let ss = await blockSigner.getSigners(block.hash)
            await db.BlockSigner.updateOne({
                blockHash: block.hash,
                blockNumber: b
            }, {
                $set: {
                    blockHash: block.hash,
                    blockNumber: b,
                    signers: ss.map(it => (it || '').toLowerCase())
                }
            }, {
                upsert: true
            })
        })
        await Promise.all(map)
    }

    // Get list event in range start - end block
    await RewardHelper.updateVoteHistory(epoch)

    // Calculate user vote for validator
    let histories = await db.VoteHistory.find({
        blockNumber: { $gte: startBlock, $lte: endBlock }
    }).sort({ blockNumber: 1 })

    logger.info('There are %s histories in epoch %s', histories.length, epoch)
    for (let i = 0; i < histories.length; i++) {
        let history = histories[i]

        if (history.event === 'Propose') {
            let data = {
                voter: history.owner,
                candidate: history.candidate,
                epoch: Math.floor(history.blockNumber / config.get('BLOCK_PER_EPOCH')),
                voteAmount: history.cap
            }
            await db.UserVoteAmount.create(data)
        } else if (history.event === 'Vote') {
            let h = await db.UserVoteAmount.findOne({
                voter: history.voter,
                candidate: history.candidate
            }).sort({ epoch: -1 })

            await db.UserVoteAmount.updateOne({
                voter: history.voter,
                candidate: history.candidate,
                epoch: Math.floor(history.blockNumber / config.get('BLOCK_PER_EPOCH'))
            }, {
                voteAmount: (h || { voteAmount: 0 }).voteAmount + history.cap
            }, { upsert: true, new: true })
        } else if (history.event === 'Unvote') {
            let h = await db.UserVoteAmount.findOne({
                voter: history.voter,
                candidate: history.candidate
            }).sort({ epoch: -1 })
            await db.UserVoteAmount.updateOne({
                voter: history.voter,
                candidate: history.candidate,
                epoch: Math.floor(history.blockNumber / config.get('BLOCK_PER_EPOCH'))
            }, {
                voteAmount: (h ? h.voteAmount : 0) - history.cap
            }, { upsert: true, new: true })
        } else if (history.event === 'Resign') {
            let h = await db.UserVoteAmount.findOne({
                voter: history.voter,
                candidate: history.candidate
            }).sort({ epoch: -1 })
            await db.UserVoteAmount.updateOne({
                voter: history.voter,
                candidate: history.candidate,
                epoch: Math.ceil(history.blockNumber / config.get('BLOCK_PER_EPOCH'))
            }, {
                voteAmount: (h ? h.voteAmount : 0) - history.cap
            }, { upsert: true, new: true })
        }
    }

    logger.info('Duplicate vote amount from prev to epoch %s', epoch)
    // Find in history and duplicate to this epoch if not found
    let voteInEpoch = await db.UserVoteAmount.find({ epoch: epoch - 1 })
    let data = []
    for (let j = 0; j < voteInEpoch.length; j++) {
        let nextEpoch = await db.UserVoteAmount.findOne({
            voter: voteInEpoch[j].voter,
            epoch: epoch,
            candidate: voteInEpoch[j].candidate
        })
        if (!nextEpoch) {
            data.push({
                voter: voteInEpoch[j].voter,
                epoch: voteInEpoch[j].epoch + 1,
                voteAmount: voteInEpoch[j].voteAmount,
                candidate: voteInEpoch[j].candidate
            })
        }
    }
    if (data.length > 0) {
        await db.UserVoteAmount.insertMany(data)
    }

    let totalSignNumber = 0

    let validators = []
    let voteHistory = await db.UserVoteAmount.find({ epoch: epoch })
    for (let i = 0; i < voteHistory.length; i++) {
        if (validators.indexOf(voteHistory[i].candidate) < 0) {
            validators.push(voteHistory[i].candidate)
        }
    }

    let rewardValidator = []
    let validatorSigners = []
    let validatorMap = validators.map(async (validator) => {
        validator = validator.toString().toLowerCase()
        let validatorSignNumber = await db.BlockSigner
            .countDocuments({
                blockNumber: { $gte: startBlock, $lte: endBlock },
                signers: validator
            })
        if (validatorSignNumber > 0) {
            totalSignNumber += validatorSignNumber
            validatorSigners.push({
                address: validator,
                signNumber: validatorSignNumber
            })
        }
    })
    await Promise.all(validatorMap)

    logger.info('calculate reward for list validator at epoch %s', epoch)
    let validatorFinal = validatorSigners.map(async (validator) => {
        let reward4group = totalReward.multipliedBy(validator.signNumber).dividedBy(totalSignNumber)
        let reward4validator = reward4group.multipliedBy(validatorRewardPercent).dividedBy(100)
        let reward4foundation = reward4group.multipliedBy(foundationRewardPercent).dividedBy(100)
        let reward4voter = reward4group.multipliedBy(voterRewardPercent).dividedBy(100)

        let blockRewardCalculate = (parseInt(epoch) + 1) * config.get('BLOCK_PER_EPOCH')

        let block = await db.Block.findOne({ number: blockRewardCalculate })
        let timestamp = new Date()
        if (!block) {
            let _block = await BlockHelper.getBlock(blockRewardCalculate)
            if (_block) {
                timestamp = _block.timestamp * 1000
            }
        } else {
            timestamp = block.timestamp
        }

        await rewardVoterProcess(epoch, validator.address, validator.signNumber, reward4voter.toString(), timestamp)

        let ownerValidator = await tomoValidator.getCandidateOwner(validator.address)
        ownerValidator = ownerValidator.toString().toLowerCase()

        let userVoteAmount = await db.UserVoteAmount.findOne({
            candidate: validator.address,
            voter: ownerValidator,
            epoch: epoch
        })
        let lockBalance = (userVoteAmount || { voteAmount: 0 }).voteAmount

        await rewardValidator.push({
            epoch: epoch,
            startBlock: startBlock,
            endBlock: endBlock,
            address: ownerValidator,
            validator: validator.address,
            reason: 'MasterNode',
            lockBalance: lockBalance.toString(),
            reward: reward4validator.toString(),
            rewardTime: timestamp,
            signNumber: validator.signNumber
        })

        // Reward for foundation
        await rewardValidator.push({
            epoch: epoch,
            startBlock: startBlock,
            endBlock: endBlock,
            address: contractAddress.foundation,
            validator: validator.address,
            reason: 'Foundation',
            lockBalance: 0,
            reward: reward4foundation.toString(),
            rewardTime: timestamp,
            signNumber: validator.signNumber
        })
    })
    await Promise.all(validatorFinal)
    if (rewardValidator.length > 0) {
        await db.Reward.insertMany(rewardValidator)
    }
    logger.info('End process at %s', new Date())
    process.exit(1)
}

async function rewardVoterProcess (epoch, validator, validatorSignNumber, totalReward, rewardTime) {
    logger.info('Process reward for voter of validator %s', validator)
    totalReward = new BigNumber(totalReward)

    let endBlock = parseInt(epoch) * config.get('BLOCK_PER_EPOCH')
    let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1

    let voteEpoch = await db.UserVoteAmount.find({ epoch: epoch, candidate: validator })
    let totalVoterCap = 0
    for (let i = 0; i < voteEpoch.length; i++) {
        totalVoterCap += voteEpoch[i].voteAmount
    }
    totalVoterCap = new BigNumber(totalVoterCap)

    let rewardVoter = []
    for (let i = 0; i < voteEpoch.length; i++) {
        let voterAddress = voteEpoch[i].voter
        let voterAmount = new BigNumber(voteEpoch[i].voteAmount)
        if (String(voterAmount) !== '0') {
            let reward = totalReward.multipliedBy(voterAmount).dividedBy(totalVoterCap)

            await rewardVoter.push({
                epoch: epoch,
                startBlock: startBlock,
                endBlock: endBlock,
                address: voterAddress,
                validator: validator,
                reason: 'Voter',
                lockBalance: voterAmount.toString(),
                reward: reward.toString(),
                rewardTime: rewardTime,
                signNumber: validatorSignNumber
            })
            if (rewardVoter.length === 5000) {
                await db.Reward.insertMany(rewardVoter)
                rewardVoter = []
            }
        }
    }

    if (rewardVoter.length > 0) {
        await db.Reward.insertMany(rewardVoter)
    }
}

module.exports = { epochReward }
