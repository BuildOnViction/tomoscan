'use strict'

import AccountHelper from '../helpers/account'

const consumer = {}
consumer.name = 'AddRewardToAccount'
consumer.processNumber = 12
consumer.task = async function (job, done) {
    let address = job.data.address.toLowerCase()
    let balance = job.data.balance
    let account = await AccountHelper.processAccount(address)

    let newBalance = parseFloat(account.balance) + parseFloat(balance)
    account.balance = newBalance.toString()
    account.balanceNumber = newBalance

    await account.save()

    done()
}

module.exports = consumer
