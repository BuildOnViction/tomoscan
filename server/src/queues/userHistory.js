'use strict'

const db = require('../models')
const BigNumber = require('bignumber.js')
const Web3Util = require('../helpers/web3')
const TomoValidatorABI = require('../contracts/abi/TomoValidator')
const contractAddress = require('../contracts/contractAddress')

const consumer = {}
consumer.name = 'UserHistoryProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let startBlock = job.data.startBlock
    let endBlock = job.data.endBlock
    let q = require('./index')

    const web3 = await Web3Util.getWeb3()
    const tomoValidator = await web3.eth.Contract(TomoValidatorABI, contractAddress.TomoValidator)
    try {
        tomoValidator.getPastEvents('allEvents', {
            filter: {},
            fromBlock: startBlock,
            toBlock: endBlock
        }, function (error, events) {
            if (error) {
                console.error(error)
                done()
                q.create('UserVoteProcess', { startBlock: startBlock, endBlock: endBlock })
                    .priority('normal').removeOnComplete(true).save()
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
                db.VoteHistory.insertMany(listUser)
            }
        })

        done()
    } catch (e) {
        let sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
        await sleep(2000)
        done()
        q.create('UserVoteProcess', { startBlock: startBlock, endBlock: endBlock })
            .priority('normal').removeOnComplete(true).save()
    }
}

module.exports = consumer
