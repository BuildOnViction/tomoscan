import mongoose from 'mongoose'
import _ from 'lodash'

const ethUtils = require('ethereumjs-util')
const ethBlock = require('ethereumjs-block/from-rpc')

export const paginate = async (
  req, model_name, params = {}, manual_paginate = false) => {
  let per_page = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 25
  per_page = Math.min(25, per_page)
  let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
  page = page > 10000 ? 10000 : page

  let query = {}, sort = {}, total = null
  if (typeof(params) != 'undefined') {
    params.query = typeof(params.query) != 'undefined' ? params.query : {}
    params.sort = typeof(params.sort) != 'undefined' ? params.sort : {}
    params.total = typeof(params.total) != 'undefined' ? params.total : null
    query = _.extend({}, params.query)
    sort = _.extend({}, params.sort)
    total = _.isInteger(params.total) ? params.total : null
  }

  let count = await mongoose.model(model_name).count()
  total = total ? total : count
  let builder = mongoose.model(model_name).find(query).sort(sort)
  if (!manual_paginate) {
    let offset = page > 1 ? (page - 1) * per_page : 0
    builder = builder.skip(offset)
    builder = builder.limit(per_page)
  }
  let items = await builder.lean().exec()

  return {
    total: total,
    per_page: per_page,
    current_page: page,
    pages: Math.ceil(total / per_page),
    items: items,
  }
}

export const getSigner = (block) => {
  var sealers = block.extraData
  if (sealers.length <= 130)
    return undefined
  var sig = ethUtils.fromRpcSig('0x' +
    sealers.substring(sealers.length - 130, sealers.length)) // remove signature
  block.extraData = block.extraData.substring(0, block.extraData.length - 130)
  var blk = ethBlock(block)
  blk.header.difficulty[0] = block.difficulty
  var sigHash = ethUtils.sha3(blk.header.serialize())
  var pubkey = ethUtils.ecrecover(sigHash, sig.v, sig.r, sig.s)
  return ethUtils.pubToAddress(pubkey).toString('hex')
}

export const toAddress = (text, length) => {
  if (isNaN(length))
    length = 16

  var end = '…'

  if (text == undefined)
    return 'new contract'
  if (text === null)
    return 'new contract'

  if (length >= String(text).length)
    end = ''

  var prefix = ''
  if (String(text).substring(0, 2) != '0x')
    prefix = '0x'
  return prefix + String(text).substring(0, length) + end
}