'use strict'

const db = require('../models')
const config = require('config')
import Web3Util from '../helpers/web3'

const TomoValidatorABI = require('../contracts/abi/TomoValidator')
const contractAddress = require('../contracts/contractAddress')

const consumer = {}
consumer.name = 'RewardValidatorProcess'
consumer.processNumber = 1
consumer.task = async function(job, done) {
    let epoch = job.data.epoch
    console.log('Process reward at epoch: ', epoch)

    let endBlock = parseInt(epoch) * config.get('BLOCK_PER_EPOCH')
    let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1

    let signers = await db.BlockSigner.find({blockNumber: {$lte: endBlock, $gte: startBlock}})
    let masterNode = {}

    await signers.forEach(async (signer) => {
        let listSigner = signer.signers
        if (listSigner !== null) {
            let n = listSigner.forEach(async (mn) => {
                if (masterNode[mn]) {
                    masterNode[mn] ++
                } else {
                    masterNode[mn] = 1
                }
            })
            // await Promise.all(n)
        }
    })
    console.log(masterNode)
    // await Promise.all(m)

    let reward4MasterNode = config.get('REWARD') * config.get('MASTER_NODE_REWARD_PERCENT')
    let reward4Foundation = config.get('REWARD') * config.get('FOUNDATION_REWARD_PERCENT')
    let reward4voter = config.get('REWARD') * config.get('VOTER_REWARD_PERCENT')

    let web3 = await Web3Util.getWeb3()
    let validatorContract = await new web3.eth.Contract(TomoValidatorABI, contractAddress.TomoValidator)

    // Calculate total sign number in a epoch
    let listSignNumber = await db.BlockSigner.aggregate(
        [
            {$match: {blockNumber: {$gte: startBlock, $lte: endBlock}}},
            {$project: {number: {$size: "$signers"}}}
        ]
    )
    let totalSignNumber = 0
    await listSignNumber.forEach(async (signNumber) => {
        totalSignNumber += signNumber.number
    })
    // end calculate

    await db.Reward.findOneAndUpdate({epoch: epoch}, {
        epoch: epoch,
        fromBlock: startBlock,
        toBlock: endBlock,
        totalReward: config.get('REWARD'),
        reward: {
            masterNode: [],
            voter: []
        }
    }, { upsert: true, new: true })

    const q = require('./index')

    let validators = await validatorContract.methods.getCandidates().call()
    let totalValidator = await validators.length
    let rewardValidator = []
    await validators.forEach(async (validator) => {
        let validatorSignNumber = await db.BlockSigner
            .count({blockNumber: {$gte: startBlock, $lte: endBlock}, signers: {$elemMatch: {$eq: validator}}})

        await q.create('RewardVoterProcess', {
            epoch: epoch,
            validator: validator,
            validatorSignNumber: validatorSignNumber,
            totalSignNumber: totalSignNumber
        })
            .priority('normal').removeOnComplete(true).save()

        let reward = (reward4MasterNode / totalValidator) * (validatorSignNumber / totalSignNumber)

        // Add reward for validator
        await q.create('AddRewardToAccount', {
            address: validator,
            balance: reward,
        })
            .priority('normal').removeOnComplete(true).save()

        let lockBalance = await validatorContract.methods.getVoterCap(validator, validator).call()
        await rewardValidator.push({
            address: validator,
            numberBlockSigner: validatorSignNumber,
            lockBalance: lockBalance,
            reward: reward
        })

    })
    await db.Reward.update({epoch: epoch}, {reward: {$set: {masterNode: rewardValidator}}})

    // Add reward for foundation
    await q.create('AddRewardToAccount', {
        address: contractAddress.foundation,
        balance: reward4Foundation,
    })
        .priority('normal').removeOnComplete(true).save()

    done()
}

module.exports = consumer
