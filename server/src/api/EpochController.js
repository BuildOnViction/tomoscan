import express from 'express'
import _ from 'lodash'
import Web3Util from '../helpers/web3'
import BlockHelper from '../helpers/block'

/**
 * ErrorHandler, considering separation for global use
 * @param {function} func - main async function of API
 * @param {defaultError} null - default-error object/function to handle err in replacement of try/cat
 * @returns {} switch to express-error-handling-middleware if defaultError not provided
 */
const handler = (func, defaultError = null) => (req, res, next) => func(req, res).catch(error => {
    console.trace(error)
    console.log(error)
    if (!defaultError) return next(error)
    if (typeof defaultError === 'function') return defaultError(res, error)
    return next(defaultError)
})

// Constants, should also be globally-available
const EXTRA_VANITY = 32
const EXTRA_SEAL = 65
const ADDR_LENGTH = 20
const EPOC = 900
const DEFAULT_ERROR = { code: 406, message: 'Something went wrong' }

// Helper function
const bytesToAddress = bytes => {
    const countAddress = bytes.length / ADDR_LENGTH
    const sliced = _.map(_.range(countAddress), (__, i) => bytes.slice(i * 20, (i + 1) * 20))
    const addressList = _.map(sliced, a => `0x${a.toString('hex')}`)
    return addressList
}

const getAllLists = block => {
    const { extraData, validators, penalties } = block._doc
    const m1m2Buff = Buffer.from(extraData.substring(2), 'hex')
    const m1m2Byte = m1m2Buff.slice(EXTRA_SEAL, m1m2Buff.length - EXTRA_VANITY)

    const m1m2List = bytesToAddress(m1m2Byte)
    const validatorList = bytesToAddress(Buffer.from(validators, 'hex'))
    const penaltyList = bytesToAddress(Buffer.from(penalties, 'hex'))
    const rewardList = [] // where to get this???

    return { ...block._doc, m1m2List, validatorList, penaltyList, rewardList }
}

// API
const GET_EPOCH = async (req, res, next) => {
    const blocksPerPage = Math.min(25, _.toInteger(req.query.limit)) || 10
    const pageCount = _.toInteger(req.query.page) || 1

    const web3 = await Web3Util.getWeb3()
    const maxBlockNumber = await web3.eth.getBlockNumber()
    const allEpochs = _.range(EPOC, maxBlockNumber, EPOC).reverse()
    const paginRange = [(pageCount - 1) * blocksPerPage, pageCount * blocksPerPage]
    const epochNumbers = _.slice(allEpochs, ...paginRange)
    const getEpochs = epochNumbers.map(BlockHelper.getBlockDetail)

    await Promise.all(getEpochs).then(items => res.json({
        items: items.map(getAllLists),
        pages: _.ceil(allEpochs.length / blocksPerPage),
        currentPage: pageCount,
        realTotal: maxBlockNumber,
        total: allEpochs.length
    }))
}

// Router
const EpochController = express.Router()
EpochController.get('/epochs', handler(GET_EPOCH, DEFAULT_ERROR))

export default EpochController
