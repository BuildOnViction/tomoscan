'use strict'

import Web3Util from '../helpers/web3'

const db = require('../models')
const config = require('config')

const TomoValidatorABI = require('../contracts/abi/TomoValidator')
const contractAddress = require('../contracts/contractAddress')

const consumer = {}
consumer.name = 'RewardValidatorProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let epoch = job.data.epoch
    console.log('Process reward at epoch: ', epoch)

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

    let reward4MasterNode = config.get('REWARD') * config.get('MASTER_NODE_REWARD_PERCENT')
    let reward4Foundation = config.get('REWARD') * config.get('FOUNDATION_REWARD_PERCENT')

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
    let totalValidator = await validators.length
    let rewardValidator = []
    let validatorMap = validators.map(async (validator) => {
        let validatorSignNumber = await db.BlockSigner
            .count({
                blockNumber: { $gte: startBlock, $lte: endBlock },
                signers: { $elemMatch: { $eq: validator.toLowerCase() } }
            })

        await q.create('RewardVoterProcess', {
            epoch: epoch,
            validator: validator.toLowerCase(),
            validatorSignNumber: validatorSignNumber,
            totalSignNumber: totalSignNumber
        })
            .priority('normal').removeOnComplete(true).save()

        let reward = (reward4MasterNode / totalValidator) * (validatorSignNumber / totalSignNumber)

        let ownerValidator = await validatorContract.methods.getCandidateOwner(validator.toLowerCase())

        // Add reward for validator
        await q.create('AddRewardToAccount', {
            address: ownerValidator.toLowerCase(),
            balance: reward
        })
            .priority('normal').removeOnComplete(true).save()

        let lockBalance = await validatorContract.methods.getVoterCap(
            validator.toLowerCase(),
            validator.toLowerCase()
        ).call()
        await rewardValidator.push({
            epoch: epoch,
            startBlock: startBlock,
            endBlock: endBlock,
            address: ownerValidator.toLowerCase(),
            isMasterNode: true,
            lockBalance: lockBalance,
            reward: reward,
            numberBlockSigner: validatorSignNumber
        })

        if (rewardValidator.length === 5000) {
            await db.Reward.insertMany(rewardValidator)
            rewardValidator = []
        }
    })
    await Promise.all(validatorMap)

    if (rewardValidator.length > 0) {
        await db.Reward.insertMany(rewardValidator)
    }

    // Add reward for foundation
    await q.create('AddRewardToAccount', {
        address: contractAddress.foundation,
        balance: reward4Foundation
    })
        .priority('normal').removeOnComplete(true).save()

    done()
}

module.exports = consumer
