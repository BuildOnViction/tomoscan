'use strict'

const db = require('../models')
const BlockSignerABI = require('../contracts/abi/BlockSigner')
const contractAddress = require('../contracts/contractAddress')
const Web3Util = require('../helpers/web3')

const consumer = {}
consumer.name = 'BlockSignerProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let startBlock = job.data.startBlock
    let endBlock = job.data.endBlock
    console.log('Get block signer from block %s to %s', startBlock, endBlock)

    const web3 = await Web3Util.getWeb3()
    const blockSigner = await new web3.eth.Contract(BlockSignerABI, contractAddress.BlockSigner)

    try {
        for (let i = startBlock; i <= endBlock; i++) {
            let block = await web3.eth.getBlock(i)
            if (!block) {
                console.error('Block %s does not exist', i)
                break
            }
            let blockHash = block.hash
            let signers = await blockSigner.methods.getSigners(blockHash).call()
            console.log('Get signer of block ', i)
            await db.BlockSigner.updateOne({
                blockHash: blockHash,
                blockNumber: i
            }, {
                $set: {
                    blockHash: blockHash,
                    blockNumber: i,
                    signers: signers.map(signer => (signer || '').toLowerCase())
                }
            }, { upsert: true })
        }
        done()
    } catch (e) {
        console.error(e)
        let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
        await sleep(2000)
        done()
        let q = require('./index')
        q.create('BlockSignerProcess', { startBlock: startBlock, endBlock: endBlock })
            .priority('normal').removeOnComplete(true).save()
    }
}

module.exports = consumer
