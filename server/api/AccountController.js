import { Router } from 'express'
import { paginate } from '../helpers/utils'

const AccountController = Router()

AccountController.get('/accounts', async (req, res) => {
  try {
    let data = await paginate(req, 'Account')

    return res.json(data)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default AccountController