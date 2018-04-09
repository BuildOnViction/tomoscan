import { Router } from 'express'
import _ from 'lodash'
import async from 'async'
import Setting from '../models/setting'
import Block from '../models/block'
import { paginate } from '../helpers/utils'
import Web3Util from '../helpers/web3'
import BlockHelper from '../helpers/block'

const BlockController = Router()

BlockController.get('/blocks', async (req, res, next) => {
  try {
    let per_page = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 10
    let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
    per_page = Math.min(25, per_page)
    let calc_page = page * per_page

    let web3 = await Web3Util.getWeb3()
    // Get latest block number count.
    let max_block_number = await web3.eth.getBlockNumber()
    let offset = max_block_number - calc_page
    let block_numbers = [], remain_numbers = []

    if (calc_page - max_block_number < per_page) {
      let max = offset + per_page
      max = max < max_block_number ? max : max_block_number
      block_numbers = _.range(offset, max)
      let exists_numbers = await Block.distinct('number',
        {number: {$in: block_numbers}})
      remain_numbers = _.xor(block_numbers, exists_numbers)
    }

    // Insert blocks remain.
    async.each(remain_numbers, async (number, next) => {
      if (number) {
        let e = await BlockHelper.addBlockByNumber(number)
        if (!e) next(e)

        next()
      }
    }, async (e) => {
      if (e) throw e

      let params = {query: {number: {$in: block_numbers}}, sort: {number: -1}}
      if (max_block_number) {
        params.total = max_block_number
      }
      let data = await paginate(req, 'Block', params, true)

      return res.json(data)
    })
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

BlockController.get('/blocks/:slug', async (req, res) => {
  try {
    let slug = req.params.slug
    let query = {}
    if (_.isNumber(slug)) {
      query = {number: slug}
    }
    else {
      query = {hash: slug}
    }

    // Find exist in db.
    let block = await Block.findOne(query)
    if (!block) {
      block = await BlockHelper.addBlockByNumber(slug)
    }

    let web3 = await Web3Util.getWeb3()
//      let test = await web3.eth.getPastLogs({
//        address: "0x52529Fa1499cBaAd662DbfC05028ba5F5c291361"
//      })
    console.log(await web3.eth.getBlockNumber())

    return res.json(block)
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

export default BlockController