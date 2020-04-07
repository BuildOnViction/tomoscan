'use strict'

const EmailService = require('../services/Email')
const db = require('../models')
const logger = require('../helpers/logger')

const consumer = {}
consumer.name = 'FollowProcess'
consumer.processNumber = 1
consumer.task = async function (job, done) {
    const transaction = job.data.transaction
    const fromAccount = job.data.fromAccount
    const toAccount = job.data.toAccount
    const blockNumber = job.data.blockNumber
    // Send email to follower.
    try {
        const cOr = (toAccount !== null)
            ? [{ address: fromAccount.toLowerCase() }, { address: toAccount.toLowerCase() }]
            : [{ address: fromAccount.toLowerCase() }]

        // TODO: should paginate it
        const followers = await db.Follow.find({
            startBlock: { $lte: blockNumber },
            sendEmail: true,
            $or: cOr
        }).limit(100)

        if (followers.length) {
            const email = new EmailService()
            for (let i = 0; i < followers.length; i++) {
                const follow = followers[i]
                const user = await db.User.findOne({ _id: follow.user.toLowerCase() })
                if (user) {
                    const tx = await db.Tx.findOne({ hash: transaction })
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
    } catch (e) {
        logger.warn('follow process error %s', e)
        done(e)
    }
    done()
}

module.exports = consumer
