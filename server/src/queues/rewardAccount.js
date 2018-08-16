'use strict'

const db = require('../models')

const consumer = {}
consumer.name = 'AddRewardToAccount'
consumer.processNumber = 6
consumer.task = async function (job, done) {
    let address = job.data.address.toLowerCase()
    let balance = job.data.balance
    let account = await db.Account.findOneAndUpdate({ hash: address }, { hash: address }, { upsert: true, new: true })

    if (account.balance) {
        account.balance = (parseFloat(account.balance) + parseFloat(balance)).toString()
        account.balanceNumber = parseFloat(account.balance)

        await account.save()
    } else {
        account.balanceNumber = parseFloat(balance)
        account.balance = balance.toString()
        await account.save()
    }

    done()
}

module.exports = consumer
