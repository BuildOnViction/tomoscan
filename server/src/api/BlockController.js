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
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        let perPage = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 10
        const page = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        perPage = Math.min(20, perPage)
        const calcPage = page * perPage

        const web3 = await Web3Util.getWeb3()
        // Get latest block number count.
        const maxBlockNumber = await web3.eth.getBlockNumber()
        const offset = maxBlockNumber - calcPage
        const last = offset + perPage

        const listBlkNum = []
        for (let i = last; i > offset; i--) {
            listBlkNum.push(i)
        }
        let items = []
        const blocks = await db.Block.find({ number: { $in: listBlkNum } })
        const finalityBlock = []

        if (blocks.length === perPage) {
            items = blocks
        } else {
            const existBlock = []
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
            const map = notExistBlock.map(async function (num) {
                const bl = await BlockHelper.getBlockOnChain(num)
                items.push(bl)
            })
            await Promise.all(map)
        }
        const finality = []
        const map2 = finalityBlock.map(async function (hash) {
            try {
                const data = {
                    jsonrpc: '2.0',
                    method: 'eth_getBlockFinalityByHash',
                    params: [hash],
                    id: 88
                }
                const response = await axios.post(config.get('WEB3_URI'), data, { timeout: 300 })
                const result = response.data

                const finalityNumber = parseInt(result.result)

                finality.push({
                    hash: hash,
                    finality: finalityNumber
                })
            } catch (e) {
                logger.warn('Cannot get block finality %s', hash)
                logger.warn(e)
            }
        })
        await Promise.all(map2)

        const result = []
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

        let pages = Math.ceil(maxBlockNumber / perPage)
        if (pages > 500) {
            pages = 500
        }
        await Promise.all(map2)

        const data = {
            total: maxBlockNumber,
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
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const hashOrNumb = req.params.slug
    try {
        let block = await BlockHelper.getBlockDetail(hashOrNumb)

        if (block === null) {
            if (!isNaN(hashOrNumb)) {
                return res.status(307).json({ blockNumber: hashOrNumb, message: 'This block is waiting to be created' })
            }
            return res.status(404).json({ errors: { message: 'Block is not found!' } })
        }
        try {
            block = block.toJSON()
        } catch (e) {
            logger.warn(e)
        }

        if (block.number % config.get('BLOCK_PER_EPOCH') === 0) {
            const slashedNode = []
            const blk = await BlockHelper.getBlock(block.number)
            if (blk.penalties && blk.penalties !== '0x') {
                const sbuff = Buffer.from((blk.penalties || '').substring(2), 'hex')
                if (sbuff.length > 0) {
                    for (let i = 1; i <= sbuff.length / 20; i++) {
                        const address = sbuff.slice((i - 1) * 20, i * 20)
                        slashedNode.push('0x' + address.toString('hex'))
                    }
                }
            }

            let buff = Buffer.from(blk.extraData.substring(2), 'hex')
            const sbuff = buff.slice(32, buff.length - 65)
            const signers = []
            if (sbuff.length > 0) {
                for (let i = 1; i <= sbuff.length / 20; i++) {
                    const address = sbuff.slice((i - 1) * 20, i * 20)
                    signers.push('0x' + address.toString('hex'))
                }
            }

            const web3 = await Web3Util.getWeb3()

            buff = Buffer.from(blk.validators.substring(2), 'hex')
            const randoms = []
            for (let i = 1; i <= buff.length / 4; i++) {
                const k = buff.slice((i - 1) * 4, i * 4)
                randoms.push(web3.utils.toUtf8('0x' + k.toString('hex')))
            }

            block.slashedNode = slashedNode
            block.randoms = randoms
            block.validators = signers
        }

        return res.json(block)
    } catch (e) {
        logger.warn('Error get block detail %s. %s', hashOrNumb, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

BlockController.get('/blocks/countdown/:number', [
    check('number').exists().isNumeric().withMessage('Block require is number.')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const number = parseInt(req.params.number)
    const web3 = await Web3Util.getWeb3()
    const currentBlock = await web3.eth.getBlockNumber()
    const remainingBlock = number - currentBlock
    const lastEpoch = await db.Epoch.find({ isActive: true }).sort({ epoch: -1 }).limit(1)
    let blockDuration = 2
    if (lastEpoch.length > 0) {
        if (lastEpoch[0].duration) {
            blockDuration = lastEpoch[0].duration / 900
        }
    }

    return res.json({
        currentBlock: currentBlock,
        countdownBlock: number,
        remainingBlock: remainingBlock,
        blockDuration: blockDuration
    })
})

BlockController.get('/blocks/:slug/address/:address', [
    check('slug').exists().isNumeric().withMessage('Block number is not correct.'),
    check('address').exists().isLength({ min: 42, max: 42 }).withMessage('Address is incorrect.')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const blockNumber = req.params.slug
    const address = req.params.address.toLowerCase()

    const txes = await db.Tx.find({ blockNumber: blockNumber, $or: [{ from: address }, { to: address }] })
    let exist = false
    if (txes.length > 0) {
        exist = true
    }
    return res.json({
        exist: exist,
        txes: txes
    })
})

BlockController.get('/blocks/signers/:slug', [
    check('slug').exists().withMessage('Block is require.')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    const blockNumberOrHash = req.params.slug
    try {
        let signers = []
        let checkInChain = true
        let block
        if (!isNaN(blockNumberOrHash)) {
            block = await db.Block.findOne({ number: blockNumberOrHash })
            const blockSigner = await db.BlockSigner.findOne({ blockNumber: blockNumberOrHash })

            if (blockSigner) {
                if (blockSigner.signers) {
                    signers = blockSigner.signers
                    checkInChain = false
                }
            }
        } else {
            block = await db.Block.findOne({ hash: blockNumberOrHash })
        }
        if (!block) {
            const web3 = await Web3Util.getWeb3()
            block = await web3.eth.getBlock(blockNumberOrHash)
        }
        if (!block) {
            return res.status(404).json({ errors: 'Not found' })
        }

        if (checkInChain) {
            try {
                const data = {
                    jsonrpc: '2.0',
                    method: 'eth_getBlockSignersByHash',
                    params: [block.hash],
                    id: 88
                }
                const response = await axios.post(config.get('WEB3_URI'), data, { timeout: 300 })
                const result = response.data
                signers = result.result
            } catch (e) {
                logger.warn('cannot get signer of block %s', block.number)
                logger.warn(e)
            }
        }

        return res.json({ signers: signers })
    } catch (e) {
        logger.warn('Error get block signer %s. %s', blockNumberOrHash, e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

BlockController.get('/blocks/finality/latestIrreversibleBlock', async (req, res) => {
    const last200Block = await db.Block.find().limit(200).sort({ number: -1 })
    let lastFinality
    for (let i = 0; i < last200Block.length; i++) {
        const b = last200Block[i]
        if (b.finality >= 75) {
            lastFinality = b.number
            break
        }
        if (i === last200Block.length - 1) {
            lastFinality = b.number
        }
    }
    return res.json({ latestIrreversibleBlock: lastFinality })
})

module.exports = BlockController
