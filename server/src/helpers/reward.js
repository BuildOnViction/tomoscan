const { tomoValidator } = require('./tomo')
const config = require('config')
const db = require('../models')
const logger = require('./logger')
const BigNumber = require('bignumber.js')
const Web3Util = require('./web3')

let RewardHelper = {
    updateVoteHistory: async (epoch, hasQueue = false, done = null) => {
        let endBlock = parseInt(epoch) * config.get('BLOCK_PER_EPOCH')
        let startBlock = endBlock - config.get('BLOCK_PER_EPOCH') + 1
        logger.info('Get vote history from block %s to block %s', startBlock, endBlock)
        await db.VoteHistory.remove({ blockNumber: { $gte: startBlock, $lte: endBlock } })

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
            await db.VoteHistory.insertMany(candidates)
        }

        const contract = await tomoValidator.getValidatorContractWs()
        await contract.getPastEvents('allEvents', { fromBlock: startBlock, toBlock: endBlock })
            .then(async (events) => {
                let map = events.map(async function (event) {
                    let voter = String(event.returnValues._voter || '').toLowerCase()
                    let owner = String(event.returnValues._owner || '').toLowerCase()
                    let candidate = String(event.returnValues._candidate || '').toLowerCase()
                    let cap = new BigNumber(event.returnValues._cap || 0)
                    let capTomo = cap.dividedBy(10 ** 18)
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
                if (hasQueue) {
                    let q = require('../queues/index')
                    q.create('UserVoteProcess', { epoch: epoch })
                        .priority('normal').removeOnComplete(true)
                        .attempts(5).backoff({ delay: 2000, type: 'fixed' }).save()
                    done()
                }
                return true
            }).catch(async (e) => {
                logger.warn('Cannot get vote history from block %s to %s. Sleep 2 seconds and try more',
                    startBlock, endBlock)
                logger.warn(e)
                let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
                await sleep(2000)
                await Web3Util.reconnectWeb3Socket()
                return RewardHelper.updateVoteHistory(epoch, hasQueue, done)
            })

        if (done !== null) {
            done()
        }
        return true
    }
}

module.exports = RewardHelper
