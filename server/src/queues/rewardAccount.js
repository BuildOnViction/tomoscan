'use strict'

const db = require('../models')
import AccountHelper from '../helpers/account'

const consumer = {}
consumer.name = 'AddRewardToAccount'
consumer.processNumber = 12
consumer.task = async function (job, done) {
    let address = job.data.address.toLowerCase()
    let balance = job.data.balance
    let account = await AccountHelper.processAccount(address)

    account.balance = (parseFloat(account.balance) + parseFloat(balance)).toString()
    account.balanceNumber = parseFloat(account.balance)

    await account.save()


    done()
}

module.exports = consumer
