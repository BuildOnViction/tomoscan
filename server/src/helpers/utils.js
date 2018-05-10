import mongoose from 'mongoose'
import CryptoJS from 'crypto-js'

const ethUtils = require('ethereumjs-util')
const ethBlock = require('ethereumjs-block/from-rpc')

export const paginate = async (
  req, model_name, params = {}, manual_paginate = false) => {
  let per_page = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 25
  per_page = Math.min(25, per_page)
  let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
  page = page > 2000 ? 2000 : page

  params.query = params.hasOwnProperty('query') ? params.query : {}
  params.sort = params.hasOwnProperty('sort') ? params.sort : {}
  params.total = params.hasOwnProperty('total') ? params.total : null
  params.populate = params.hasOwnProperty('populate') ? params.populate : []

  let count = await mongoose.model(model_name).find(params.query).count()
  let total = params.total ? params.total : count
  let pages = Math.ceil(total / per_page)
  pages = Math.min(2000, pages)
  let builder = mongoose.model(model_name).
    find(params.query).
    sort(params.sort)
  if (!manual_paginate) {
    let offset = page > 1 ? (page - 1) * per_page : 0
    builder = builder.skip(offset)
    builder = builder.limit(per_page)
  }
  builder = builder.populate(params.populate)
  let items = await builder.lean().exec()

  return {
    total: total,
    per_page: per_page,
    current_page: page,
    pages: pages,
    items: items,
  }
}

export const trimWord = (word) => CryptoJS.enc.Utf8.parse(
  word.replace(/^\s+|\s+$|\s+(?=\s)/g, '').
    replace('\t', '').
    replace(/\u0000/g, '')).trim()

export const getSigner = (block) => {
  let signer = null
  if (block) {
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
    signer = ethUtils.pubToAddress(pubkey).toString('hex')
  }
  return signer
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

export const unformatAddress = (address) => address.replace(
  '0x000000000000000000000000', '0x')

export const formatAddress = (address) => address.replace('0x',
  '0x000000000000000000000000')

