import { Router } from 'express'
import { paginate } from '../helpers/utils'
import LogRepository from '../repositories/LogRepository'

const LogController = Router()

LogController.get('/logs', async (req, res) => {
  try {
    let address = req.query.address
    let params = {}
    if (address) {
      params.query = {address: address, $where: 'this.topics.length > 1'}
    }
    let tx = req.query.tx
    if (tx) {
      params.query = {transactionHash: tx}
    }
    params.sort = {blockNumber: -1}
    let data = await paginate(req, 'Log', params)
    let items = data.items
    for (let i = 0; i < items.length; i++) {
      data.items[i] = await LogRepository.formatItem(items[i])
    }

    return res.json(data)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default LogController