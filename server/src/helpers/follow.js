const db = require('../models')
const AccountHelper = require('./account')

let FollowHelper = {
    async firstOrUpdate (req, user, startBlock) {
        let address = req.body.address.toLowerCase()
        let name = req.body.name
        let update = {
            user: user,
            name: name,
            address: address,
            sendEmail: req.body.sendEmail,
            notifyReceive: req.body.notifyReceive,
            notifySent: req.body.notifySent,
            startBlock: startBlock
        }

        let allow = await db.Follow.findOneAndUpdate({ user: user, address: address },
            update, { upsert: true, new: true })
        return allow
    },

    async formatItems (items) {
        let length = items.length
        for (let i = 0; i < length; i++) {
            let hash = items[i].address
            let addressObj = await db.Account.findOne({ hash: hash })
            if (!addressObj) {
                addressObj = await AccountHelper.getAccountDetail(hash)
            }
            items[i].addressObj = addressObj
        }

        return items
    }
}

module.exports = FollowHelper
