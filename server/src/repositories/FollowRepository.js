let FollowRepository = {
  async firstOrUpdate (req) {
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

    return awaitFollow.firstOrCreate({user: user, address: address},
      update, {upsert: true, new: true})
  },
}

export default FollowRepository