import { Router } from 'express'
import db from '../models'
import Web3Util from '../helpers/web3'
import BlockHelper from '../helpers/block'
const config = require('config')
const logger = require('../helpers/logger')

const BlockController = Router()

BlockController.get('/blocks', async (req, res, next) => {
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
                    finalityBlock.push(blocks[i].number)
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
        let map2 = finalityBlock.map(async function (number) {
            let b = await web3.eth.getBlock(number)
            if (b) {
                finality.push({
                    block: number,
                    finality: b.finality
                })
            }
        })

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
                if (finality[i].block === result[j].number) {
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
        logger.warn(e)
        return res.status(406).send()
    }
})

BlockController.get('/blocks/:slug', async (req, res) => {
    try {
        let hashOrNumb = req.params.slug

        let block = await BlockHelper.getBlockDetail(hashOrNumb)

        if (block === null) {
            return res.status(404).json({ message: 'Block is not found!' })
        }

        return res.json(block)
    } catch (e) {
        logger.warn(e)
        return res.status(406).send()
    }
})

BlockController.get('/blocks/signers/:slug', async (req, res) => {
    try {
        let blockNumber = req.params.slug
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
            let web3 = await Web3Util.getWeb3()

            let block = await web3.eth.getBlock(blockNumber)
            signers = []
            if (block.signers) {
                signers = block.signers
            }
        }

        return res.json({ signers: signers })
    } catch (e) {
        logger.warn(e)
        return res.status(406).send()
    }
})

BlockController.get('/blocks/list/finality', async (req, res) => {
    try {
        let numbers = req.query.numbers
        let listNumber = numbers.split(',')
        let resp = {}

        if (listNumber) {
            let web3 = await Web3Util.getWeb3()
            let map = listNumber.map(async function (number) {
                let block = await web3.eth.getBlock(number)
                resp[number] = block.finality
            })
            await Promise.all(map)
        }

        return res.json(resp)
    } catch (e) {
        logger.warn(e)
        return res.status(406).send()
    }
})

export default BlockController
