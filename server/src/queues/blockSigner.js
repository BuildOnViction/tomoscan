'use strict'

const db = require('../models')
const BlockSignerABI = require('../contracts/abi/BlockSigner')
const contractAddress = require('../contracts/contractAddress')
const Web3Util = require('../helpers/web3')
const config = require('config')

const consumer = {}
consumer.name = 'BlockSignerProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let startBlock = job.data.startBlock
    let endBlock = job.data.endBlock
    console.log('Get block signer from block %s to %s', startBlock, endBlock)

    const web3 = await Web3Util.getWeb3()
    const blockSigner = await new web3.eth.Contract(BlockSignerABI, contractAddress.BlockSigner)

    let numbers = []
    for (let i = startBlock; i <= endBlock; i++) {
        numbers.push(i)
    }
    try {
        let map = numbers.map(async function (number) {
            let block = await web3.eth.getBlock(number)
            if (block) {
                let blockHash = block.hash
                let signers = await blockSigner.methods.getSigners(blockHash).call()
                console.log('Get signer of block ', number)
                await db.BlockSigner.updateOne({
                    blockHash: blockHash,
                    blockNumber: number
                }, {
                    $set: {
                        blockHash: blockHash,
                        blockNumber: number,
                        signers: signers.map(signer => (signer || '').toLowerCase())
                    }
                }, { upsert: true })
            }
        })
        await Promise.all(map)

        if (parseInt(endBlock) % config.get('BLOCK_PER_EPOCH') === 0) {
            let q = require('./index')
            let epoch = parseInt(endBlock) / config.get('BLOCK_PER_EPOCH')
            q.create('UserHistoryProcess', { epoch: epoch })
                .priority('normal').removeOnComplete(true)
                .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
        }
        done()
    } catch (e) {
        console.error(e)
        done(e)
    }
}

module.exports = consumer
