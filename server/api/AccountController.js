import { Router } from 'express'
import { paginate } from '../helpers/utils'
import Account from '../models/Account'
import BigNumber from 'bignumber.js'
import AccountRepository from '../repositories/AccountRepository'

const AccountController = Router()

AccountController.get('/accounts', async (req, res) => {
  try {
    let data = await paginate(req, 'Account', {sort: {balanceNumber: -1}})

    // Append percent to response.
//    let all_balances = await Account.aggregate(
//      [{$group: {_id: null, total: {$sum: '$balance'}}}])
//    let total = all_balances[0].total
//
//    data.items.forEach((item, index) => {
//      data.items[index].percent = (item.balanceNumber * 100) / total
//    })
//    data.total_balance = total

    // Format rank.
    let base_rank = (data.current_page - 1) * data.per_page
    data.items.forEach((item, index) => {
      data.items[index].rank = base_rank + index + 1
    })

    return res.json(data)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

AccountController.get('/accounts/:slug', async (req, res) => {
  try {
    let slug = req.params.slug
    let account = account = AccountRepository.updateAccount(slug)

    return res.json(account)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default AccountController