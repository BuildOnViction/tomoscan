const axios = require('axios')
const { tomoValidator, blockSigner } = require('./tomo')
const config = require('config')
const db = require('../models')
const logger = require('./logger')
const BigNumber = require('bignumber.js')
const Web3Util = require('./web3')
const BlockHelper = require('./block')
const contractAddress = require('../contracts/contractAddress')
const urlJoin = require('url-join')
const elastic = require('../helpers/elastic')
const RewardHelper = {
    updateVoteHistory: async (epoch) => {
        const endBlock = parseInt(epoch) * config.get('BLOCK_PER_EPOCH')
        let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1
        if (parseInt(epoch) === 2) {
            startBlock = endBlock - (config.get('BLOCK_PER_EPOCH') * 2) + 1
        }
        logger.info('Get vote history from block %s to block %s', startBlock, endBlock)
        await db.VoteHistory.deleteOne({ blockNumber: { $gte: startBlock, $lte: endBlock } })

        if (parseInt(epoch) === 2) {
            const defaultCandidate = config.get('defaultCandidate')
            const candidates = []
            const map = defaultCandidate.map(candidate => {
                candidates.push({
                    txHash: null,
                    blockNumber: 1,
                    event: 'Propose',
                    blockHash: null,
                    voter: candidate.owner,
                    owner: candidate.owner,
                    candidate: candidate.candidate,
                    cap: candidate.cap
                })
            })
            await Promise.all(map)
            await db.VoteHistory.insertMany(candidates)
        }

        const contract = await tomoValidator.getValidatorContractWs()
        await contract.getPastEvents('allEvents', { fromBlock: startBlock, toBlock: endBlock })
            .then(async (events) => {
                const map = events.map(async function (event) {
                    const voter = String(event.returnValues._voter || '').toLowerCase()
                    const owner = String(event.returnValues._owner || '').toLowerCase()
                    const candidate = String(event.returnValues._candidate || '').toLowerCase()
                    const cap = new BigNumber(event.returnValues._cap || 0)
                    const capTomo = cap.dividedBy(10 ** 18)
                    BigNumber.config({ EXPONENTIAL_AT: [-100, 100] })

                    return {
                        txHash: event.transactionHash,
                        blockNumber: event.blockNumber,
                        event: event.event,
                        blockHash: event.blockHash,
                        voter: voter,
                        owner: owner,
                        candidate: candidate,
                        cap: capTomo.toNumber()
                    }
                })
                return Promise.all(map)
            })
            .then(async data => {
                if (data.length > 0) {
                    await db.VoteHistory.insertMany(data)
                }
                return true
            }).catch(async (e) => {
                logger.warn('Cannot get vote history from block %s to %s. Sleep 2 seconds and try more. Error %s',
                    startBlock, endBlock, e)
                const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
                await sleep(2000)
                await Web3Util.reconnectWeb3Socket()
                return RewardHelper.updateVoteHistory(epoch)
            })

        return true
    },

    rewardProcess: async (epoch) => {
        epoch = parseInt(epoch)
        const startBlock = (epoch - 1) * config.get('BLOCK_PER_EPOCH') + 1
        const endBlock = (epoch) * config.get('BLOCK_PER_EPOCH')

        const maxBlockNum = await BlockHelper.getLastBlockNumber()
        if (maxBlockNum - config.get('BLOCK_PER_EPOCH') < endBlock) {
            logger.warn('Epoch %s is waiting for calculate', epoch)
            return
        }
        logger.info('Calculate reward from block %s to block %s', startBlock, endBlock)

        // Delete old reward
        logger.info('Remove old reward of epoch %s', epoch)
        await db.Reward.deleteOne({ epoch: epoch })

        const totalReward = new BigNumber(config.get('REWARD'))
        const validatorRewardPercent = new BigNumber(config.get('MASTER_NODE_REWARD_PERCENT'))
        const foundationRewardPercent = new BigNumber(config.get('FOUNDATION_REWARD_PERCENT'))
        const voterRewardPercent = new BigNumber(config.get('VOTER_REWARD_PERCENT'))

        // Update block signer
        for (let i = startBlock; i <= endBlock; i = i + 50) {
            const its = []
            for (let j = i; j < i + 50; j++) {
                its.push(j)
            }
            logger.info('Update block signer from block %s to block %s', i, i + 49)
            const map = its.map(async (b) => {
                const block = await BlockHelper.getBlock(b)

                const ss = await blockSigner.getSigners(block.hash)
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
        await RewardHelper.updateVoteHistory(epoch + 1)

        // Vote history process
        await RewardHelper.voteHistoryProcess(epoch)

        logger.info('Duplicate vote amount from prev to epoch %s', epoch)
        // Find in history and duplicate to this epoch if not found
        const voteInEpoch = await db.UserVoteAmount.find({ epoch: epoch - 1 })
        const data = []
        for (let j = 0; j < voteInEpoch.length; j++) {
            const nextEpoch = await db.UserVoteAmount.findOne({
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

        const validators = []
        const voteHistory = await db.UserVoteAmount.find({ epoch: epoch })
        for (let i = 0; i < voteHistory.length; i++) {
            if (validators.indexOf(voteHistory[i].candidate) < 0) {
                validators.push(voteHistory[i].candidate)
            }
        }

        const rewardValidator = []
        const validatorSigners = []
        const validatorMap = validators.map(async (validator) => {
            validator = validator.toString().toLowerCase()
            const validatorSignNumber = await db.BlockSigner
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
        const validatorFinal = validatorSigners.map(async (validator) => {
            const reward4group = totalReward.multipliedBy(validator.signNumber).dividedBy(totalSignNumber)
            const reward4validator = reward4group.multipliedBy(validatorRewardPercent).dividedBy(100)
            const reward4foundation = reward4group.multipliedBy(foundationRewardPercent).dividedBy(100)
            const reward4voter = reward4group.multipliedBy(voterRewardPercent).dividedBy(100)

            const blockRewardCalculate = (epoch + 1) * config.get('BLOCK_PER_EPOCH')

            const block = await db.Block.findOne({ number: blockRewardCalculate })
            let timestamp = new Date()
            if (!block) {
                const _block = await BlockHelper.getBlock(blockRewardCalculate)
                if (_block) {
                    timestamp = _block.timestamp * 1000
                }
            } else {
                timestamp = block.timestamp
            }

            await RewardHelper.rewardVoterProcess(
                epoch,
                validator.address,
                validator.signNumber,
                reward4voter.toString(),
                timestamp
            )

            let ownerValidator = await tomoValidator.getCandidateOwner(validator.address)
            ownerValidator = ownerValidator.toString().toLowerCase()

            const userVoteAmount = await db.UserVoteAmount.findOne({
                candidate: validator.address,
                voter: ownerValidator,
                epoch: epoch
            })
            const lockBalance = (userVoteAmount || { voteAmount: 0 }).voteAmount

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
                address: contractAddress.TomoFoundation,
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
    },

    voteHistoryProcess: async (epoch) => {
        logger.info('Remove old user vote amount for epoch %s', epoch)
        await db.UserVoteAmount.deleteOne({ epoch: epoch })
        if (epoch === 1) {
            await db.UserVoteAmount.deleteOne({ epoch: 0 })
        }
        const endBlock = (parseInt(epoch) + 1) * config.get('BLOCK_PER_EPOCH')
        let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1
        if (parseInt(epoch) === 1) {
            startBlock = endBlock - config.get('BLOCK_PER_EPOCH') * 2 + 1
        }

        // Calculate user vote for validator
        const histories = await db.VoteHistory.find({
            blockNumber: { $gte: startBlock, $lte: endBlock }
        }).sort({ blockNumber: 1 })

        logger.info('There are %s histories in epoch %s', histories.length, epoch)
        for (let i = 0; i < histories.length; i++) {
            const history = histories[i]

            if (history.event === 'Propose') {
                const data = {
                    voter: history.owner,
                    candidate: history.candidate,
                    epoch: Math.floor(history.blockNumber / config.get('BLOCK_PER_EPOCH')),
                    voteAmount: history.cap
                }
                await db.UserVoteAmount.create(data)
            } else if (history.event === 'Vote') {
                const h = await db.UserVoteAmount.findOne({
                    voter: history.voter,
                    candidate: history.candidate,
                    epoch: { $lte: epoch }
                }).sort({ epoch: -1 })

                await db.UserVoteAmount.updateOne({
                    voter: history.voter,
                    candidate: history.candidate,
                    // epoch: Math.floor(history.blockNumber / config.get('BLOCK_PER_EPOCH'))
                    epoch: epoch
                }, {
                    voteAmount: (h || { voteAmount: 0 }).voteAmount + history.cap
                }, { upsert: true, new: true })
            } else if (history.event === 'Unvote') {
                const h = await db.UserVoteAmount.findOne({
                    voter: history.voter,
                    candidate: history.candidate,
                    epoch: { $lte: epoch }
                }).sort({ epoch: -1 })
                await db.UserVoteAmount.updateOne({
                    voter: history.voter,
                    candidate: history.candidate,
                    // epoch: Math.floor(history.blockNumber / config.get('BLOCK_PER_EPOCH'))
                    epoch: epoch
                }, {
                    voteAmount: (h ? h.voteAmount : 0) - history.cap
                }, { upsert: true, new: true })
            } else if (history.event === 'Resign') {
                const h = await db.UserVoteAmount.findOne({
                    voter: history.voter,
                    candidate: history.candidate,
                    epoch: { $lt: epoch }
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
    },

    rewardVoterProcess: async (epoch, validator, validatorSignNumber, totalReward, rewardTime) => {
        logger.info('Process reward for voter of validator %s', validator)
        totalReward = new BigNumber(totalReward)

        const endBlock = parseInt(epoch) * config.get('BLOCK_PER_EPOCH')
        const startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1

        const voteEpoch = await db.UserVoteAmount.find({ epoch: epoch, candidate: validator })
        let totalVoterCap = 0
        for (let i = 0; i < voteEpoch.length; i++) {
            totalVoterCap += voteEpoch[i].voteAmount
        }
        totalVoterCap = new BigNumber(totalVoterCap)

        let rewardVoter = []
        for (let i = 0; i < voteEpoch.length; i++) {
            const voterAddress = voteEpoch[i].voter
            const voterAmount = new BigNumber(voteEpoch[i].voteAmount)
            if (String(voterAmount) !== '0') {
                const reward = totalReward.multipliedBy(voterAmount).dividedBy(totalVoterCap)

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
    },

    rewardOnChain: async (epoch, calculateTime = 0) => {
        const block = await BlockHelper.getBlock((parseInt(epoch) + 1) * config.get('BLOCK_PER_EPOCH'))
        const endBlock = parseInt(epoch) * config.get('BLOCK_PER_EPOCH')
        const startBlock = endBlock - config.get('BLOCK_PER_EPOCH')
        const data = {
            jsonrpc: '2.0',
            method: 'eth_getRewardByHash',
            params: [block.hash],
            id: 88
        }

        try {
            await db.Reward.deleteMany({ epoch: epoch })
            await db.EpochSign.deleteMany({ epoch: epoch })
            try {
                await elastic.deleteByQuery('rewards', {
                    query: {
                        term: { epoch: epoch }
                    }
                })
            } catch (e) {
                logger.warn('there are no reward at epoch %s to delete', epoch)
            }

            // const response = await axios.post('http://128.199.228.202:8545/', data)
            const response = await axios.post(config.get('WEB3_URI'), data)
            const result = response.data
            if (!result.error) {
                const signNumber = result.result.signers
                const rewards = result.result.rewards

                const url = urlJoin(config.get('TOMOMASTER_API_URL'), '/api/candidates')
                const c = await axios.get(url)
                const canR = c.data.items
                const canName = {}
                if (canR) {
                    for (let i = 0; i < canR.length; i++) {
                        canName[canR[i].candidate] = canR[i].name
                    }
                }

                const rdata = []
                let mnNumber = 0
                for (const m in rewards) {
                    mnNumber += 1
                    for (const v in rewards[m]) {
                        let r = new BigNumber(rewards[m][v])
                        r = r.dividedBy(10 ** 18).toString()
                        const item = {
                            epoch: epoch,
                            startBlock: startBlock,
                            endBlock: endBlock,
                            address: v.toLowerCase(),
                            validator: m.toLowerCase(),
                            validatorName: canName[m.toLowerCase()] ? canName[m.toLowerCase()] : 'Anonymous',
                            reason: v.toLowerCase() === contractAddress.TomoFoundation ? 'Foundation' : 'Voter',
                            lockBalance: 0,
                            reward: r,
                            rewardTime: block.timestamp * 1000,
                            signNumber: signNumber[m].sign
                        }
                        await elastic.indexWithoutId('rewards', item)
                        rdata.push(item)
                    }
                }
                const sdata = []
                for (const m in signNumber) {
                    sdata.push({
                        epoch: epoch,
                        validator: m.toLowerCase(),
                        signNumber: signNumber[m].sign
                    })
                }
                if (sdata.length > 0) {
                    await db.EpochSign.insertMany(sdata)
                }

                const sBlock = await BlockHelper.getBlockDetail(startBlock)
                const eBlock = await BlockHelper.getBlockDetail(endBlock)

                if (rdata.length > 0) {
                    logger.info('Insert %s rewards to db', rdata.length)
                    await db.Reward.insertMany(rdata)
                } else {
                    logger.info('There is no reward found. Wait 10 seconds and retry')
                    const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
                    await sleep(10000)
                    calculateTime += 1
                    if (calculateTime === 5) {
                        logger.error('Cannot find reward for epoch %s at block %s', epoch, block)
                        return false
                    }
                    return RewardHelper.rewardOnChain(epoch, calculateTime)
                }
                const vNumber = await db.Reward.distinct('address', { epoch: epoch })

                await db.Epoch.updateOne({ epoch: epoch }, {
                    epoch: epoch,
                    startBlock: startBlock,
                    endBlock: endBlock,
                    startTime: sBlock.timestamp,
                    endTime: eBlock.timestamp,
                    duration: (new Date(eBlock.timestamp) - new Date(sBlock.timestamp)) / 1000,
                    masterNodeNumber: mnNumber,
                    voterNumber: vNumber.length,
                    isActive: true
                }, { upsert: true, new: true })

                return true
            } else {
                logger.warn('There are some error of epoch %s. Error %s', epoch, JSON.stringify(result.error))
                return false
            }
        } catch (e) {
            logger.warn('There are something error of epoch %s. Error %s', epoch, e)
            return false
        }
    }
}

module.exports = RewardHelper
