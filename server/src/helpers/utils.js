const mongoose = require('mongoose')

const ethUtils = require('ethereumjs-util')
const ethBlock = require('ethereumjs-block/from-rpc')
const config = require('config')
const logger = require('./logger')

const utils = {
    paginate: async (
        req, modelName, params = {}, total = null, manualPaginate = false) => {
        let perPage = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 25
        perPage = Math.min(100, perPage)
        let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        let start = new Date()

        params.query = params.hasOwnProperty('query') ? params.query : {}
        params.sort = params.hasOwnProperty('sort') ? params.sort : { _id: -1 }
        params.total = params.hasOwnProperty('total') ? params.total : null
        params.populate = params.hasOwnProperty('populate') ? params.populate : []

        if (total === null) {
            total = await mongoose.model(modelName).countDocuments(params.query)
        }

        let pages = Math.ceil(total / perPage)

        let builder = mongoose.model(modelName)
            .find(params.query)
            .sort(params.sort)
        let offset = page > 1 ? (page - 1) * perPage : 0
        if (!manualPaginate) {
            builder = builder.skip(offset)
            builder = builder.limit(perPage)
        }
        builder = builder.populate(params.populate)
        let items = await builder.lean().exec()

        if (pages > 500) {
            pages = 500
        }
        let end = new Date() - start
        logger.info(`Paginate execution time : %dms model %s query %s sort %s skip %s limit %s`,
            end,
            modelName,
            JSON.stringify(params.query),
            JSON.stringify(params.sort), offset, perPage)

        let limitedRecords = config.get('LIMITED_RECORDS')
        let newTotal = total > limitedRecords ? limitedRecords : total

        if (total === 0) {
            total = items.length
        }
        if (newTotal === 0) {
            newTotal = items.length
        }

        return {
            realTotal: total,
            total: newTotal,
            perPage: perPage,
            currentPage: page,
            pages: pages,
            items: items
        }
    },
    trimWord: async (word) => {
        return word
            .replace('\t', '')
            .replace(/\u0000/g, '') // eslint-disable-line no-control-regex
            .replace(/\u0004/g, '') // eslint-disable-line no-control-regex
            .replace(/\u001a/g, '') // eslint-disable-line no-control-regex
            .trim()
    },
    getSigner: async (block) => {
        let signer = null
        if (block && block.number > 0) {
            var sealers = block.extraData
            if (sealers.length <= 130) { return undefined }
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
    },
    toAddress: async (text, length) => {
        if (isNaN(length)) { length = 16 }

        var end = '…'

        if (text === undefined || text === null) {
            return '0x0000000000000000000000000000000000000000'
        }

        if (length >= String(text).length) {
            end = ''
        }

        var prefix = ''
        if (String(text).substring(0, 2) !== '0x') { prefix = '0x' }
        return prefix + String(text).substring(0, length) + end
    },
    unformatAddress: async (address) => {
        return address.replace(
            '0x000000000000000000000000', '0x').toLowerCase()
    },
    formatAddress: async (address) => {
        return address.replace('0x',
            '0x000000000000000000000000')
    },
    formatAscIIJSON: async (obj) => {
        let json = JSON.stringify(obj)
        json = json.replace(/(\\u[\da-zA-Z]{4})/gm, '')
        json = json.replace(/(\\b)/gm, '')

        return JSON.parse(json)
    },
    convertHexToFloat: async (str, radix) => {
        var parts = str.split('.')
        if (parts.length > 1) {
            return parseInt(parts[0], radix) + parseInt(parts[1], radix) /
                Math.pow(radix, parts[1].length)
        }
        return parseInt(parts[0], radix)
    }

}

module.exports = utils
