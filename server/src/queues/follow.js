'use strict'

import EmailService from '../services/Email'
const db = require('../models')

const consumer = {}
consumer.name = 'FollowProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    let transaction = job.data.transaction
    let fromAccount = job.data.fromAccount
    let toAccount = job.data.toAccount
    let blockNumber = job.data.blockNumber
    console.log('Process Follow at transaction ', transaction)
    // Send email to follower.
    let cOr = (toAccount !== null)
        ? [{ address: fromAccount.toLowerCase() }, { address: toAccount.toLowerCase() }]
        : [{ address: fromAccount.toLowerCase() }]

    let followers = await db.Follow.find({
        startBlock: { $lte: blockNumber },
        sendEmail: true,
        $or: cOr
    })

    if (followers.length) {
        let email = new EmailService()
        for (let i = 0; i < followers.length; i++) {
            let follow = followers[i]
            let user = await db.User.findOne({ _id: follow.user.toLowerCase() })
            if (user) {
                let tx = db.Tx.findOne({ hash: transaction })
                if (follow.notifySent && follow.address === fromAccount.toLowerCase()) {
                    // isSent email template.
                    email.followAlert(user, tx, follow.address, 'sent')
                } else if (follow.notifyReceive && follow.address === toAccount.toLowerCase()) {
                    // isReceive email template.
                    email.followAlert(user, tx, follow.address, 'received')
                }
            }
        }
    }
    done()
}

module.exports = consumer
