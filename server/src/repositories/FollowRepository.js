import Follow from '../models/Follow'

let FollowRepository = {
  async firstOrUpdate (req, user) {
    let address = req.body.address
    let name = req.body.name
    let update = {
      user: user,
      name: name,
      address: address,
      sendEmail: req.body.sendEmail,
      notifyReceive: req.body.notifyReceive,
      notifySent: req.body.notifySent,
    }

    return await Follow.findOneAndUpdate({user: user, address: address},
      update, {upsert: true, new: true})
  },
}

export default FollowRepository