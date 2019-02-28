const { Router } = require('express')
const db = require('../models')
const Web3Util = require('../helpers/web3')
const BlockHelper = require('../helpers/block')
const config = require('config')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')
const axios = require('axios')

const BlockController = Router()

BlockController.get('/blocks', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt().withMessage('Require page is number')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let perPage = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 10
        let page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        perPage = Math.min(20, perPage)
        let calcPage = page * perPage

        let web3 = await Web3Util.getWeb3()
        // Get latest block number count.
        let maxBlockNumber = await web3.eth.getBlockNumber()
        let offset = maxBlockNumber - calcPage
        let last = offset + perPage

        let listBlkNum = []
        for (let i = last; i > offset; i--) {
            listBlkNum.push(i)
        }
        let items = []
        let blocks = await db.Block.find({ number: { $in: listBlkNum } })
        let finalityBlock = []

        if (blocks.length === perPage) {
            items = blocks
        } else {
            let existBlock = []
            for (let i = 0; i < blocks.length; i++) {
                items.push(blocks[i])
                existBlock.push(blocks[i].number)
                if (blocks[i].finality < 50) {
                    finalityBlock.push(blocks[i].hash)
                }
            }
            let notExistBlock = []
            if (existBlock.length === 0) {
                notExistBlock = listBlkNum
            } else {
                for (let i = 0; i < listBlkNum.length; i++) {
                    if (!existBlock.includes(listBlkNum[i])) {
                        notExistBlock.push(listBlkNum[i])
                    }
                }
            }
            let map = notExistBlock.map(async function (num) {
                let bl = await BlockHelper.getBlockOnChain(num)
                items.push(bl)
            })
            await Promise.all(map)
        }
        let finality = []
        let map2 = finalityBlock.map(async function (hash) {
            let data = {
                'jsonrpc': '2.0',
                'method': 'eth_getBlockFinalityByHash',
                'params': [hash],
                'id': 88
            }
            const response = await axios.post(config.get('WEB3_URI'), data)
            let result = response.data

            let finalityNumber = parseInt(result.result)

            finality.push({
                hash: hash,
                finality: finalityNumber
            })
        })
        await Promise.all(map2)

        let result = []
        for (let i = 0; i < listBlkNum.length; i++) {
            for (let j = 0; j < items.length; j++) {
                if (listBlkNum[i] === items[j].number) {
                    result.push(items[j])
                }
            }
        }

        for (let i = 0; i < finality.length; i++) {
            for (let j = 0; j < result.length; j++) {
                if (finality[i].hash === result[j].hash) {
                    result[j].finality = finality[i].finality
                    break
                }
            }
        }

        let limitedRecords = config.get('LIMITED_RECORDS')
        let newTotal = maxBlockNumber > limitedRecords ? limitedRecords : maxBlockNumber
        let pages = Math.ceil(maxBlockNumber / perPage)
        if (pages > 500) {
            pages = 500
        }
        await Promise.all(map2)

        let data = {
            realTotal: maxBlockNumber,
            total: newTotal,
            perPage: perPage,
            currentPage: page,
            pages: pages,
            items: result
        }
        return res.json(data)
    } catch (e) {
        logger.warn('Error get list block %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

BlockController.get('/blocks/:slug', [
    check('slug').exists().withMessage('Block is require.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let hashOrNumb = req.params.slug
    try {
        let block = await BlockHelper.getBlockDetail(hashOrNumb)

        if (block === null) {
            return res.status(404).json({ errors: { message: 'Block is not found!' } })
        }

        return res.json(block)
    } catch (e) {
        logger.warn('Error get block detail %s. %s', hashOrNumb, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

BlockController.get('/blocks/signers/:slug', [
    check('slug').exists().withMessage('Block is require.')
], async (req, res) => {
    let errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    let blockNumber = req.params.slug
    try {
        let blockSigner = await db.BlockSigner.findOne({ blockNumber: blockNumber })

        let signers
        let checkInChain = false
        if (blockSigner) {
            if (blockSigner.signers) {
                signers = blockSigner.signers
            } else {
                checkInChain = true
            }
        } else {
            checkInChain = true
        }

        if (checkInChain) {
            let block = await db.Block.findOne({ number: blockNumber })
            let data = {
                'jsonrpc': '2.0',
                'method': 'eth_getBlockSignersByHash',
                'params': [block.hash],
                'id': 88
            }
            const response = await axios.post(config.get('WEB3_URI'), data)
            let result = response.data
            signers = result.result
        }

        return res.json({ signers: signers })
    } catch (e) {
        logger.warn('Error get block signer %s. %s', blockNumber, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

module.exports = BlockController
