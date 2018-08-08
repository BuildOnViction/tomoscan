import { Router } from 'express'
import _ from 'lodash'
import async from 'async'
import db from '../models'
import { paginate } from '../helpers/utils'
import Web3Util from '../helpers/web3'
import BlockRepository from '../repositories/BlockRepository'

const BlockController = Router()

BlockController.get('/blocks', async (req, res, next) => {
    try {
        let perPage = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 10
        let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        perPage = Math.min(25, perPage)
        let calcPage = page * perPage

        let web3 = await Web3Util.getWeb3()
        // Get latest block number count.
        let maxBlockNumber = await web3.eth.getBlockNumber()
        let offset = maxBlockNumber - calcPage
        let blockNumbers = []
        let remainNumbers = []

        if (calcPage - maxBlockNumber < perPage) {
            let max = offset + perPage
            max = max < maxBlockNumber ? max : maxBlockNumber
            blockNumbers = _.range(offset, max)
            let existNumbers = await db.Block.distinct('number',
                { number: { $in: blockNumbers } })
            remainNumbers = _.xor(blockNumbers, existNumbers)
        }

        // Insert blocks remain.
        async.each(remainNumbers, async (number, next) => {
            if (number) {
                let e = await BlockRepository.addBlockByNumber(number)
                if (!e) next(e)

                next()
            }
        }, async (e) => {
            if (e) throw e

            let params = { query: { number: { $in: blockNumbers } }, sort: { number: -1 } }
            if (maxBlockNumber) {
                params.total = maxBlockNumber
            }
            // Check filter type.
            if (req.query.filter) {
                switch (req.query.filter) {
                case 'latest':
                    params.sort = { number: -1 }
                    break
                }
            }
            // Check specific latest block number in request.
            if (req.query.to) {
                params.query = {}
            }
            let data = await paginate(req, 'Block', params, true)

            return res.json(data)
        })
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

BlockController.get('/blocks/:slug', async (req, res) => {
    try {
        let hashOrNumb = req.params.slug
        let query = {}
        if (_.isNumber(hashOrNumb)) {
            query = { number: hashOrNumb }
        } else {
            query = { hash: hashOrNumb }
        }

        // Find exist in db.
        let block = await db.Block.findOne(query)
        if (!block) {
            block = await BlockRepository.addBlockByNumber(hashOrNumb)
        }

        return res.json(block)
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

BlockController.get('/blocks/signers/:slug', async (req, res) => {
    try {
        let blockNumber = req.params.slug

        let web3 = await Web3Util.getWeb3()

        let blockSigner = await web3.eth.getBlock(blockNumber)
        return res.json({signers: blockSigner.signers})
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

export default BlockController
