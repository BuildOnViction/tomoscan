import { Router } from 'express'
import { paginate } from '../helpers/utils'
import Account from '../models/Account'
import AccountRepository from '../repositories/AccountRepository'

const AccountController = Router()

AccountController.get('/accounts', async (req, res) => {
  try {
    let data = await paginate(req, 'Account',
      {query: {status: true}, sort: {balanceNumber: -1}})

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
    let items = data.items
    let baseRank = (data.currentPage - 1) * data.perPage
    for (let i = 0; i < items.length; i++) {
      items[i]['rank'] = baseRank + i + 1
    }
    data.items = items

    return res.json(data)
  }
  catch (e) {
    console.trace(e)
    console.log(e)
    return res.status(500).send()
  }
})

AccountController.get('/accounts/:slug', async (req, res) => {
  try {
    let hash = req.params.slug
    hash = hash.toLowerCase()
    let account = await AccountRepository.updateAccount(hash)
    account = await AccountRepository.formatItem(account)

    return res.json(account)
  }
  catch (e) {
    console.trace(e)
    console.log(e)
    return res.status(500).send()
  }
})

AccountController.get('/accounts/:slug/mined', async (req, res) => {
  try {
    let hash = req.params.slug
    hash = hash.toLowerCase()
    let params = {}
    if (hash) {
      params.query = {signer: hash}
    }
    params.sort = {number: -1}
    let data = await paginate(req, 'Block', params)

    return res.json(data)
  }
  catch (e) {
    console.trace(e)
    console.log(e)
    return res.status(500).send()
  }
})

export default AccountController