import express from 'express'
import _ from 'lodash'
import Web3Util from '../helpers/web3'
import BlockHelper from '../helpers/block'

const EpochController = express.Router()

EpochController.get('/epochs', async (req, res, next) => {
    try {
        const blocksPerPage = Math.min(25, _.toInteger(req.query.limit)) || 10
        const pageCount = _.toInteger(req.query.page) || 1

        const web3 = await Web3Util.getWeb3()
        const maxBlockNumber = await web3.eth.getBlockNumber()
        const allEpochs = _.range(900, maxBlockNumber, 900).reverse()
        const paginRange = [(pageCount - 1) * blocksPerPage, pageCount * blocksPerPage]
        const epochNumbers = _.slice(allEpochs, ...paginRange)
        const getEpochs = epochNumbers.map(BlockHelper.getBlockDetail)

        await Promise.all(getEpochs).then(items => res.json({
            items,
            pages: _.ceil(allEpochs.length / blocksPerPage),
            currentPage: pageCount,
            realTotal: maxBlockNumber,
            total: allEpochs.length
        }))
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(406).send()
    }
})

export default EpochController
