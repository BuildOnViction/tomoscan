import mongoose from 'mongoose'

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

export const trimWord = (word) => utf8Encode(
  word.replace(/^\s+|\s+$|\s+(?=\s)/g, '').
    replace('\t', '').
    trim())

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

/**
 * Encodes multi-byte Unicode string into utf-8 multiple single-byte characters
 * (BMP / basic multilingual plane only).
 *
 * Chars in range U+0080 - U+07FF are encoded in 2 chars, U+0800 - U+FFFF in 3 chars.
 *
 * Can be achieved in JavaScript by unescape(encodeURIComponent(str)),
 * but this approach may be useful in other languages.
 *
 * @param   {string} unicodeString - Unicode string to be encoded as UTF-8.
 * @returns {string} UTF8-encoded string.
 */
export const utf8Encode = function (unicodeString) {
  if (typeof unicodeString != 'string') throw new TypeError(
    'parameter ‘unicodeString’ is not a string')
  const utf8String = unicodeString.replace(
    /[\u0080-\u07ff]/g,  // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
    function (c) {
      var cc = c.charCodeAt(0)
      return String.fromCharCode(0xc0 | cc >> 6, 0x80 | cc & 0x3f)
    },
  ).replace(
    /[\u0800-\uffff]/g,  // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
    function (c) {
      var cc = c.charCodeAt(0)
      return String.fromCharCode(0xe0 | cc >> 12, 0x80 | cc >> 6 & 0x3F, 0x80 |
        cc & 0x3f)
    },
  )
  return utf8String
}

/**
 * Decodes utf-8 encoded string back into multi-byte Unicode characters.
 *
 * Can be achieved JavaScript by decodeURIComponent(escape(str)),
 * but this approach may be useful in other languages.
 *
 * @param   {string} utf8String - UTF-8 string to be decoded back to Unicode.
 * @returns {string} Decoded Unicode string.
 */
export const utf8Decode = function (utf8String) {
  if (typeof utf8String != 'string') throw new TypeError(
    'parameter ‘utf8String’ is not a string')
  // note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
  const unicodeString = utf8String.replace(
    /[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g,  // 3-byte chars
    function (c) {  // (note parentheses for precedence)
      var cc = ((c.charCodeAt(0) & 0x0f) << 12) |
        ((c.charCodeAt(1) & 0x3f) << 6) | ( c.charCodeAt(2) & 0x3f)
      return String.fromCharCode(cc)
    },
  ).replace(
    /[\u00c0-\u00df][\u0080-\u00bf]/g,                 // 2-byte chars
    function (c) {  // (note parentheses for precedence)
      var cc = (c.charCodeAt(0) & 0x1f) << 6 | c.charCodeAt(1) & 0x3f
      return String.fromCharCode(cc)
    },
  )
  return unicodeString
}

