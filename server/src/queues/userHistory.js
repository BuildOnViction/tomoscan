'use strict'

const db = require('../models')
const BigNumber = require('bignumber.js')
const Web3Util = require('../helpers/web3')
const config = require('config')
const TomoValidatorABI = require('../contracts/abi/TomoValidator')
const contractAddress = require('../contracts/contractAddress')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'UserHistoryProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let epoch = job.data.epoch
    if (parseInt(epoch) === 1) {
        let defaultCandidate = config.get('defaultCandidate')
        let candidates = []
        let map = defaultCandidate.map(candidate => {
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
        console.log(candidates)
        await db.VoteHistory.insertMany(candidates)
    }
    let endBlock = parseInt(epoch) * config.get('BLOCK_PER_EPOCH')
    let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1
    let q = require('./index')

    const web3 = await Web3Util.getWeb3()
    if (parseInt(epoch) !== 1) {
        await db.VoteHistory.remove({ blockNumber: { $gte: startBlock, $lte: endBlock } })
    }
    const tomoValidator = await new web3.eth.Contract(TomoValidatorABI, contractAddress.TomoValidator)
    try {
        await tomoValidator.getPastEvents('allEvents', {
            filter: {},
            fromBlock: startBlock,
            toBlock: endBlock
        }, async function (error, events) {
            if (error) {
                logger.error(error)
                done(error)
            }
            let listUser = []

            for (let i = 0; i < events.length; i++) {
                let event = events[i]
                let voter = String(event.returnValues._voter || '').toLowerCase()
                let owner = String(event.returnValues._owner || '').toLowerCase()
                let candidate = String(event.returnValues._candidate || '').toLowerCase()
                let cap = new BigNumber(event.returnValues._cap || 0)
                let capTomo = cap.dividedBy(10 ** 18)
                BigNumber.config({ EXPONENTIAL_AT: [-100, 100] })
                let item = {
                    txHash: event.transactionHash,
                    blockNumber: event.blockNumber,
                    event: event.event,
                    blockHash: event.blockHash,
                    voter: voter,
                    owner: owner,
                    candidate: candidate,
                    cap: capTomo.toNumber()
                }
                listUser.push(item)
                if (listUser.length >= 5000) {
                    db.VoteHistory.insertMany(listUser)
                    listUser = []
                }
            }

            if (listUser.length > 0) {
                await db.VoteHistory.insertMany(listUser)
            }
            q.create('UserVoteProcess', { epoch: epoch })
                .priority('normal').removeOnComplete(true)
                .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
            done()
        })

        done()
    } catch (e) {
        let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
        await sleep(2000)
        done(e)
    }
}

module.exports = consumer
