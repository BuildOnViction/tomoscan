'use strict'

const db = require('../models')
const BigNumber = require('bignumber.js')

const consumer = {}
consumer.name = 'AddRewardToAccount'
consumer.processNumber = 12
consumer.task = async function (job, done) {
    let address = job.data.address.toLowerCase()
    let balance = job.data.balance
    console.log('AddReward balance', balance, 'to account', address)
    try {
        if (balance !== 'NaN') {
            balance = new BigNumber(balance)

            let account = await db.Account.findOne({ hash: address })
            let newBalance = new BigNumber(account.balance).plus(balance.multipliedBy(10 ** 18))

            account.balance = newBalance.toString()
            account.balanceNumber = newBalance.toNumber()
            if (account.rewardCount) {
                account.rewardCount += 1
            } else {
                account.rewardCount = 1
            }

            await account.save()
        }
    } catch (e) {
        console.error(consumer.name, e)
        done(e)
    }
    done()
}

module.exports = consumer
