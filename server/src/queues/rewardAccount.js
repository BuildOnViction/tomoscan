'use strict'

import AccountHelper from '../helpers/account'
import BigNumber from 'bignumber.js'

const consumer = {}
consumer.name = 'AddRewardToAccount'
consumer.processNumber = 12
consumer.task = async function (job, done) {
    let address = job.data.address.toLowerCase()
    let balance = job.data.balance
    console.log('AddReward balance', balance, 'to account', address)
    if (balance !== 'NaN') {
        balance = new BigNumber(balance)

        let account = await AccountHelper.processAccount(address)
        let newBalance = new BigNumber(account.balance).plus(balance)

        account.balance = newBalance.toString()
        account.balanceNumber = newBalance.toNumber()

        await account.save()

        done()
    }
}

module.exports = consumer
