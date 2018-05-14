import Follow from '../models/Follow'
import AccountRepository from './AccountRepository'
import Account from '../models/Account'

let FollowRepository = {
  async firstOrUpdate (req, user, startBlock) {
    let address = req.body.address
    let name = req.body.name
    let update = {
      user: user,
      name: name,
      address: address,
      sendEmail: req.body.sendEmail,
      notifyReceive: req.body.notifyReceive,
      notifySent: req.body.notifySent,
      startBlock: startBlock,
    }

    return await Follow.findOneAndUpdate({user: user, address: address},
      update, {upsert: true, new: true})
  },

  async formatItems (items) {
    let length = items.length
    for (let i = 0; i < length; i++) {
      let hash = items[i].address
      let addressObj = await Account.findOne({hash: hash})
      if (!addressObj) {
        addressObj = await AccountRepository.updateAccount(hash)
      }
      items[i].addressObj = addressObj
    }

    return items
  },
}

export default FollowRepository