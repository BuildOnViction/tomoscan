const mongoose = require('mongoose')

const ethUtils = require('ethereumjs-util')
const BlockHeader = require('ethereumjs-block/header')
const logger = require('./logger')
const BigNumber = require('bignumber.js')

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
        let items = await builder.maxTimeMS(20000).lean().exec()

        if (pages > 500) {
            pages = 500
        }
        let end = new Date() - start
        logger.info(`Paginate execution time : %dms model %s query %s sort %s skip %s limit %s`,
            end,
            modelName,
            JSON.stringify(params.query),
            JSON.stringify(params.sort), offset, perPage)

        if (total === 0) {
            total = items.length
        }

        return {
            total: total,
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
            .replace(/[^ -~]+/g, '') // eslint-disable-line no-control-regex
            .replace(/[^\x20-\x7E]+/g, '') // eslint-disable-line no-control-regex
            .replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '') // eslint-disable-line no-control-regex
            .trim()
    },
    removeXMLInvalidChars: async (string, removeDiscouragedChars = true) => {
        // remove everything forbidden by XML 1.0 specifications, plus the unicode replacement character U+FFFD
        /* eslint-disable max-len */
        let regex = /((?:[\0-\x08\x0B\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))/g // eslint-disable-line no-control-regex
        string = string.replace(regex, '')

        if (removeDiscouragedChars) {
            // remove everything not suggested by XML 1.0 specifications

            regex = new RegExp(
                '([\\x7F-\\x84]|[\\x86-\\x9F]|[\\uFDD0-\\uFDEF]|(?:\\uD83F[\\uDFFE\\uDFFF])|(?:\\uD87F[\\uDF' +
                'FE\\uDFFF])|(?:\\uD8BF[\\uDFFE\\uDFFF])|(?:\\uD8FF[\\uDFFE\\uDFFF])|(?:\\uD93F[\\uDFFE\\uD' +
                'FFF])|(?:\\uD97F[\\uDFFE\\uDFFF])|(?:\\uD9BF[\\uDFFE\\uDFFF])|(?:\\uD9FF[\\uDFFE\\uDFFF])' +
                '|(?:\\uDA3F[\\uDFFE\\uDFFF])|(?:\\uDA7F[\\uDFFE\\uDFFF])|(?:\\uDABF[\\uDFFE\\uDFFF])|(?:\\' +
                'uDAFF[\\uDFFE\\uDFFF])|(?:\\uDB3F[\\uDFFE\\uDFFF])|(?:\\uDB7F[\\uDFFE\\uDFFF])|(?:\\uDBBF' +
                '[\\uDFFE\\uDFFF])|(?:\\uDBFF[\\uDFFE\\uDFFF])(?:[\\0-\\t\\x0B\\f\\x0E-\\u2027\\u202A-\\uD7FF\\' +
                'uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|' +
                '(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF]))', 'g')
            string = string.replace(regex, '')
        }

        return string.trim()
    },
    getSigner: async (block) => {
        let signer = null
        if (block && block.number > 0) {
            const dataBuff = ethUtils.toBuffer(block.extraData)
            const sig = ethUtils.fromRpcSig(dataBuff.slice(dataBuff.length - 65, dataBuff.length))

            block.extraData = '0x' + ethUtils.toBuffer(block.extraData).slice(0, dataBuff.length - 65).toString('hex')

            const headerHash = new BlockHeader({
                parentHash: ethUtils.toBuffer(block.parentHash),
                uncleHash: ethUtils.toBuffer(block.sha3Uncles),
                coinbase: ethUtils.toBuffer(block.miner),
                stateRoot: ethUtils.toBuffer(block.stateRoot),
                transactionsTrie: ethUtils.toBuffer(block.transactionsRoot),
                receiptTrie: ethUtils.toBuffer(block.receiptsRoot),
                bloom: ethUtils.toBuffer(block.logsBloom),
                difficulty: ethUtils.toBuffer(parseInt(block.difficulty)),
                number: ethUtils.toBuffer(block.number),
                gasLimit: ethUtils.toBuffer(block.gasLimit),
                gasUsed: ethUtils.toBuffer(block.gasUsed),
                timestamp: ethUtils.toBuffer(block.timestamp),
                extraData: ethUtils.toBuffer(block.extraData),
                mixHash: ethUtils.toBuffer(block.mixHash),
                nonce: ethUtils.toBuffer(block.nonce)
            })

            const pub = ethUtils.ecrecover(headerHash.hash(), sig.v, sig.r, sig.s)

            signer = ethUtils.addHexPrefix(ethUtils.pubToAddress(pub).toString('hex'))
        }
        return signer
    },
    getM1M2: async (block) => {
        let dataBuff = ethUtils.toBuffer(block.extraData)
        let sig = ethUtils.fromRpcSig(dataBuff.slice(dataBuff.length - 65, dataBuff.length))

        block.extraData = '0x' + ethUtils.toBuffer(block.extraData).slice(0, dataBuff.length - 65).toString('hex')

        let headerHash = new BlockHeader({
            parentHash: ethUtils.toBuffer(block.parentHash),
            uncleHash: ethUtils.toBuffer(block.sha3Uncles),
            coinbase: ethUtils.toBuffer(block.miner),
            stateRoot: ethUtils.toBuffer(block.stateRoot),
            transactionsTrie: ethUtils.toBuffer(block.transactionsRoot),
            receiptTrie: ethUtils.toBuffer(block.receiptsRoot),
            bloom: ethUtils.toBuffer(block.logsBloom),
            difficulty: ethUtils.toBuffer(parseInt(block.difficulty)),
            number: ethUtils.toBuffer(block.number),
            gasLimit: ethUtils.toBuffer(block.gasLimit),
            gasUsed: ethUtils.toBuffer(block.gasUsed),
            timestamp: ethUtils.toBuffer(block.timestamp),
            extraData: ethUtils.toBuffer(block.extraData),
            mixHash: ethUtils.toBuffer(block.mixHash),
            nonce: ethUtils.toBuffer(block.nonce)
        })

        let pub = ethUtils.ecrecover(headerHash.hash(), sig.v, sig.r, sig.s)
        let m1 = ethUtils.addHexPrefix(ethUtils.pubToAddress(pub).toString('hex'))
        m1 = m1.toLowerCase()

        let m2
        try {
            let dataBuffM2 = ethUtils.toBuffer(block.validator)
            let sigM2 = ethUtils.fromRpcSig(dataBuffM2.slice(dataBuffM2.length - 65, dataBuffM2.length))
            let pubM2 = ethUtils.ecrecover(headerHash.hash(), sigM2.v, sigM2.r, sigM2.s)
            m2 = ethUtils.addHexPrefix(ethUtils.pubToAddress(pubM2).toString('hex'))
            m2 = m2.toLowerCase()
        } catch (e) {
            logger.warn('Cannot get m2 of block %s. Error %s', block.number, e)
            m2 = 'N/A'
        }
        return { m1, m2 }
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
    },
    formatNumber: (number) => {
        number = new BigNumber(number.toString())
        let seps = number.toString().split('.')
        seps[0] = seps[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        return seps.join('.')
    },
    hiddenString: (string, numberStringShowing) => {
        if (string === null || string === '') {
            return ''
        }
        if (string.length <= numberStringShowing * 2 + 3) {
            return string
        }
        let stringBeforeDot = String(string).substr(0, numberStringShowing)
        let stringAfterDot = String(string).substr(-numberStringShowing)
        return stringBeforeDot + '...' + stringAfterDot
    }

}

module.exports = utils
