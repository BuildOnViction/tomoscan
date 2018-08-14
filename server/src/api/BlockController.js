import { Router } from 'express'
import _ from 'lodash'
import async from 'async'
import db from '../models'
import { paginate } from '../helpers/utils'
import Web3Util from '../helpers/web3'
import BlockHelper from '../helpers/block'

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
                let e = await BlockHelper.processBlock(number)
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

        // Find exist in db.
        // let block = await db.Block.findOne(query)
        let block = await db.Block.findOne({hash: hashOrNumb})
        if (!block) {
            block = await db.Block.findOne({number: hashOrNumb})
        }
        let check_finality = true
        if (!block) {
            check_finality = false
            let web3 = await Web3Util.getWeb3()
            block = await web3.eth.getBlock(hashOrNumb)
            // block = await BlockRepository.addBlockByNumber(hashOrNumb)
        }

        if (check_finality && parseInt(block.finality) < 100) {
            let web3 = await Web3Util.getWeb3()
            let b = await web3.eth.getBlock(hashOrNumb)
            let finalityNumber
            if (b.finality){
                finalityNumber = parseInt(b.finality)
            } else {
                finalityNumber = 0
            }
            if (block.number === 0) {
                finalityNumber = 100
            }

            block.finality = finalityNumber
            block.save()

            await db.BlockSigner.findOneAndUpdate({blockNumber: block.number}, {
                blockNumber: block.number,
                finality: finalityNumber,
                signers: b.signers
            }, { upsert: true, new: true })

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
        let blockSigner = await db.BlockSigner.findOne({blockNumber: blockNumber})

        let signers
        let checkInChain = false
        if (blockSigner) {
            if (blockSigner.signers) {
                signers = blockSigner.signers
            }
            else {
                checkInChain = true
            }
        } else {
            checkInChain = true
        }

        if (checkInChain){
            let web3 = await Web3Util.getWeb3()

            let block = await web3.eth.getBlock(blockNumber)
            signers = []
            if (block.signers) {
                signers = block.signers
            }
        }

        return res.json({signers: signers})
    } catch (e) {
        console.trace(e)
        console.log(e)
        return res.status(500).send()
    }
})

export default BlockController
