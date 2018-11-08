const BigNumber = require('bignumber.js')
const Web3Util = require('../helpers/web3')
const db = require('../models')
const config = require('config')
const TomoValidatorABI = require('../contracts/abi/TomoValidator')
const BlockSignerABI = require('../contracts/abi/BlockSigner')
const contractAddress = require('../contracts/contractAddress')

const epochReward = async (epoch) => {
    console.log('Start process', new Date())
    let startBlock = (epoch - 1) * config.get('BLOCK_PER_EPOCH') + 1
    let endBlock = (epoch) * config.get('BLOCK_PER_EPOCH')
    const web3 = await Web3Util.getWeb3()

    let maxBlockNum = await web3.eth.getBlockNumber()
    if (maxBlockNum - config.get('BLOCK_PER_EPOCH') < endBlock) {
        console.log('Epoch is waiting for calculate')
        return
    }
    console.log('Re-calculate reward from block %s to block %s', startBlock, endBlock)

    // Delete old reward
    console.log('Remove old reward')
    await db.Reward.remove({ epoch: epoch })

    let totalReward = new BigNumber(config.get('REWARD')).multipliedBy(10 ** 18)
    let validatorRewardPercent = new BigNumber(config.get('MASTER_NODE_REWARD_PERCENT'))
    let foundationRewardPercent = new BigNumber(config.get('FOUNDATION_REWARD_PERCENT'))
    let voterRewardPercent = new BigNumber(config.get('VOTER_REWARD_PERCENT'))

    let validatorContract = await new web3.eth.Contract(TomoValidatorABI, contractAddress.TomoValidator)
    let bs = await new web3.eth.Contract(BlockSignerABI, contractAddress.BlockSigner)

    // verify block was on chain
    console.log('Begin get block signer')
    for (let i = startBlock; i <= endBlock; i++) {
        let blockHash = (await web3.eth.getBlock(i)).hash
        let ss = await bs.methods.getSigners(blockHash).call()
        await db.BlockSigner.updateOne({
            blockHash: blockHash,
            blockNumber: i
        }, {
            $set: {
                blockHash: blockHash,
                blockNumber: i,
                signers: ss.map(it => (it || '').toLowerCase())
            }
        }, {
            upsert: true
        }).then(function () {
            if (i % 50 === 0) {
                console.log('Update block signer block', i, new Date())
            }
        })
    }

    let totalSignNumber = 0

    let validators = await validatorContract.methods.getCandidates().call()
    let rewardValidator = []
    let validatorSigners = []
    console.log('Count block signer for list validator', new Date())
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

    console.log('calculate reward for list validator ', new Date())
    let validatorFinal = validatorSigners.map(async (validator) => {
        let reward4group = totalReward.multipliedBy(validator.signNumber).dividedBy(totalSignNumber)
        let reward4validator = reward4group.multipliedBy(validatorRewardPercent).dividedBy(100)
        let reward4foundation = reward4group.multipliedBy(foundationRewardPercent).dividedBy(100)
        let reward4voter = reward4group.multipliedBy(voterRewardPercent).dividedBy(100)

        let blockRewardCalculate = (epoch + 1) * config.get('BLOCK_PER_EPOCH')

        let block = await db.Block.findOne({ number: blockRewardCalculate })
        let timestamp = new Date()
        if (!block) {
            let _block = await web3.eth.getBlock(blockRewardCalculate)
            if (_block) {
                timestamp = _block.timestamp * 1000
            }
        } else {
            timestamp = block.timestamp
        }

        await rewardVoterProcess(epoch, validator.address, validator.signNumber, reward4voter.toString(), timestamp)

        let ownerValidator = await validatorContract.methods.getCandidateOwner(validator.address).call()
        ownerValidator = ownerValidator.toString().toLowerCase()

        let lockBalance = await validatorContract.methods.getVoterCap(validator.address, ownerValidator).call()
        await rewardValidator.push({
            epoch: epoch,
            startBlock: startBlock,
            endBlock: endBlock,
            address: ownerValidator,
            validator: validator.address,
            reason: 'MasterNode',
            lockBalance: new BigNumber(lockBalance).toString(),
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
    console.log('End process', new Date())
    process.exit(1)
}

async function rewardVoterProcess (epoch, validator, validatorSignNumber, totalReward, rewardTime) {
    if (!rewardTime) {
        rewardTime = new Date()
    }
    totalReward = new BigNumber(totalReward)
    console.log('Process reward for voter of validator', validator)

    let endBlock = parseInt(epoch) * config.get('BLOCK_PER_EPOCH')
    let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1

    try {
        let web3 = await Web3Util.getWeb3()
        let validatorContract = await new web3.eth.Contract(TomoValidatorABI, contractAddress.TomoValidator)

        let voters = await validatorContract.methods.getVoters(validator).call()

        let totalVoterCap = await validatorContract.methods.getCandidateCap(validator).call()
        totalVoterCap = new BigNumber(totalVoterCap)
        let listVoters = []
        let voterMap = voters.map(async (voter) => {
            voter = voter.toString().toLowerCase()
            let voterCap = await validatorContract.methods.getVoterCap(validator, voter).call()
            voterCap = new BigNumber(voterCap)
            listVoters.push({
                address: voter,
                balance: voterCap
            })
        })
        await Promise.all(voterMap)

        let rewardVoter = []

        let listVoterMap = listVoters.map(async (voter) => {
            if (voter.balance.toString() !== '0') {
                let voterAddress = voter.address.toString().toLowerCase()
                let reward = totalReward.multipliedBy(voter.balance).dividedBy(totalVoterCap)

                await rewardVoter.push({
                    epoch: epoch,
                    startBlock: startBlock,
                    endBlock: endBlock,
                    address: voterAddress,
                    validator: validator,
                    reason: 'Voter',
                    lockBalance: voter.balance.toString(),
                    reward: reward.toString(),
                    rewardTime: rewardTime,
                    signNumber: validatorSignNumber
                })
            }

            if (rewardVoter.length === 5000) {
                await db.Reward.insertMany(rewardVoter)
                rewardVoter = []
            }
        })
        await Promise.all(listVoterMap)
        if (rewardVoter.length > 0) {
            await db.Reward.insertMany(rewardVoter)
        }
    } catch (e) {
        console.error('error voter reward of validator', validator, 'Auto re-calculate')
        await rewardVoterProcess(epoch, validator, validatorSignNumber, totalReward, rewardTime)
    }
}

module.exports = { epochReward }
