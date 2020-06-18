const axios = require('axios')
const config = require('config')
const db = require('../models')
const logger = require('./logger')
const BigNumber = require('bignumber.js')
const BlockHelper = require('./block')
const contractAddress = require('../contracts/contractAddress')
const urlJoin = require('url-join')
const elastic = require('../helpers/elastic')

const RewardHelper = {
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
            let haveReward = false
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

                let rdata = []
                let mnNumber = 0
                for (const m in rewards) {
                    mnNumber += 1
                    for (const v in rewards[m]) {
                        if (!haveReward) {
                            haveReward = true
                        }
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
                        await elastic.indexWithoutId('rewards', {
                            epoch: epoch,
                            address: v.toLowerCase(),
                            validator: m.toLowerCase(),
                            validatorName: canName[m.toLowerCase()] ? canName[m.toLowerCase()] : 'Anonymous',
                            reward: r,
                            rewardTime: (new Date(block.timestamp * 1000)).toISOString()
                                .replace(/T/, ' ').replace(/\..+/, ''),
                            signNumber: signNumber[m].sign
                        })
                        rdata.push(item)
                        if (rdata.length === 100) {
                            logger.info('insert %s _rewards_ item at epoch %s', rdata.length, epoch)
                            await db.Reward.insertMany(rdata)
                            rdata = []
                        }
                    }
                }
                if (rdata.length > 0) {
                    logger.info('insert %s _rewards_ item at epoch %s', rdata.length, epoch)
                    await db.Reward.insertMany(rdata)
                }

                let sdata = []
                for (const m in signNumber) {
                    sdata.push({
                        epoch: epoch,
                        validator: m.toLowerCase(),
                        signNumber: signNumber[m].sign
                    })
                    if (sdata.length === 100) {
                        await db.EpochSign.insertMany(sdata)
                        sdata = []
                    }
                }
                if (sdata.length > 0) {
                    await db.EpochSign.insertMany(sdata)
                }

                const sBlock = await BlockHelper.getBlockDetail(startBlock)
                const eBlock = await BlockHelper.getBlockDetail(endBlock)

                if (!haveReward) {
                    logger.info('There is no _rewards_ found. Wait 10 seconds and retry')
                    const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time))
                    await sleep(10000)
                    calculateTime += 1
                    if (calculateTime === 5) {
                        logger.error('Cannot find _rewards_ for epoch %s at block %s', epoch, block)
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
                logger.warn('There are some error get _rewards_ of epoch %s. Error %s', epoch,
                    JSON.stringify(result.error))
                return false
            }
        } catch (e) {
            logger.warn('There are something error of epoch %s. Error %s', epoch, e)
            return false
        }
    }
}

module.exports = RewardHelper
