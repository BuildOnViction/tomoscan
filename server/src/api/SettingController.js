import { Router } from 'express'
import Block from '../models/Block'
import Account from '../models/Account'
import Token from '../models/Token'

const SettingController = Router()

SettingController.get('/setting', async (req, res, next) => {
  try {
    // Get total blocks in db.
    let totalBlock = await Block.find().count()
    let totalAddress = await Account.find().count()
    let totalToken = await Token.find().count()
    let totalSmartContract = await Account.find({isContract: true}).count()
    let lastBlock = await Block.findOne().sort({number: -1})

    return res.json(
      {
        lastBlock,
        stats: {totalBlock, totalAddress, totalToken, totalSmartContract},
      })
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default SettingController