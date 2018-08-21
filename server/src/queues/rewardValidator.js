'use strict'

import Web3Util from '../helpers/web3'
import BigNumber from 'bignumber.js'

const db = require('../models')
const config = require('config')

const TomoValidatorABI = require('../contracts/abi/TomoValidator')
const contractAddress = require('../contracts/contractAddress')

const consumer = {}
consumer.name = 'RewardValidatorProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let epoch = job.data.epoch
    console.log('Process reward for validator at epoch: ', epoch)

    let endBlock = parseInt(epoch) * config.get('BLOCK_PER_EPOCH')
    let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1

    // let signers = await db.BlockSigner.find({blockNumber: {$lte: endBlock, $gte: startBlock}})
    // let masterNode = {}
    //
    // let signerMap = signers.map(async (signer) => {
    //     let listSigner = signer.signers
    //     if (listSigner !== null) {
    //         let sn = listSigner.map(async (mn) => {
    //             if (masterNode[mn]) {
    //                 masterNode[mn] ++
    //             } else {
    //                 masterNode[mn] = 1
    //             }
    //         })
    //         await Promise.all(sn)
    //     }
    // })
    // await Promise.all(signerMap)

    let totalReward = new BigNumber(config.get('REWARD')).multipliedBy(10 ** 18)

    let web3 = await Web3Util.getWeb3()
    let validatorContract = await new web3.eth.Contract(TomoValidatorABI, contractAddress.TomoValidator)

    // Calculate total sign number in a epoch
    let listSignNumber = await db.BlockSigner.aggregate(
        [
            { $match: { blockNumber: { $gte: startBlock, $lte: endBlock } } },
            { $project: { number: { $size: '$signers' } } }
        ]
    )
    let totalSignNumber = 0
    let totalSignMap = listSignNumber.map(async (signNumber) => {
        totalSignNumber += signNumber.number
    })
    await Promise.all(totalSignMap)
    // end calculate

    const q = require('./index')

    let validators = await validatorContract.methods.getCandidates().call()
    let rewardValidator = []
    let validatorMap = validators.map(async (validator) => {
        validator = validator.toString().toLowerCase()
        let validatorSignNumber = await db.BlockSigner
            .count({
                blockNumber: { $gte: startBlock, $lte: endBlock },
                signers: { $elemMatch: { $eq: validator } }
            })
        let validatorRewardPercent = new BigNumber(config.get('MASTER_NODE_REWARD_PERCENT'))
        let foundationRewardPercent = new BigNumber(config.get('FOUNDATION_REWARD_PERCENT'))
        let voterRewardPercent = new BigNumber(config.get('VOTER_REWARD_PERCENT'))

        let reward4group = totalReward.multipliedBy(validatorSignNumber).dividedBy(totalSignNumber)
        let reward4validator = reward4group.multipliedBy(validatorRewardPercent).dividedBy(100)
        let reward4foundation = reward4group.multipliedBy(foundationRewardPercent).dividedBy(100)
        let reward4voter = reward4group.multipliedBy(voterRewardPercent).dividedBy(100)

        q.create('RewardVoterProcess', {
            epoch: epoch,
            validator: validator,
            validatorSignNumber: validatorSignNumber,
            totalReward: reward4voter
        })
            .priority('normal').removeOnComplete(true).save()

        let ownerValidator = await validatorContract.methods.getCandidateOwner(validator).call()
        ownerValidator = ownerValidator.toString().toLowerCase()

        // Add reward for validator
        q.create('AddRewardToAccount', {
            address: ownerValidator,
            balance: reward4validator
        })
            .priority('normal').removeOnComplete(true).save()

        let lockBalance = await validatorContract.methods.getVoterCap(validator, ownerValidator).call()
        await rewardValidator.push({
            epoch: epoch,
            startBlock: startBlock,
            endBlock: endBlock,
            address: ownerValidator,
            validator: validator,
            reason: 'Validator',
            lockBalance: new BigNumber(lockBalance),
            reward: reward4validator.toString(),
            signNumber: validatorSignNumber
        })

        // Reward for foundation
        await rewardValidator.push({
            epoch: epoch,
            startBlock: startBlock,
            endBlock: endBlock,
            address: contractAddress.foundation,
            validator: validator,
            reason: 'Foundation',
            lockBalance: 0,
            reward: reward4foundation.toString(),
            signNumber: validatorSignNumber
        })
        q.create('AddRewardToAccount', {
            address: contractAddress.foundation,
            balance: reward4foundation
        })
            .priority('normal').removeOnComplete(true).save()
    })
    await Promise.all(validatorMap)
    if (rewardValidator.length > 0) {
        await db.Reward.insertMany(rewardValidator)
    }

    done()
}

module.exports = consumer
