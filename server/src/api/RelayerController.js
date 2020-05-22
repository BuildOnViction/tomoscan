const { Router } = require('express')
const { BigNumber } = require('bignumber.js')
const axios = require('axios')
const config = require('config')
const dexDb = require('../models/dex')
const logger = require('../helpers/logger')
const { check, validationResult } = require('express-validator/check')

const RelayerController = Router()

RelayerController.get('/relayers', [
    check('limit').optional().isInt({ max: 50 }).withMessage('Limit is less than 50 items per page'),
    check('page').optional().isInt({ max: 500 }).withMessage('Page is less than or equal 500')
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }
    try {
        const total = await dexDb.Relayer.countDocuments()
        const limit = !isNaN(req.query.limit) ? parseInt(req.query.limit) : 20
        const currentPage = !isNaN(req.query.page) ? parseInt(req.query.page) : 1
        const pages = Math.ceil(total / limit)
        const relayers = await dexDb.Relayer.find({})
            .sort({ _id: -1 }).limit(limit).skip((currentPage - 1) * limit).lean().exec()
        const response = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: relayers
        }
        let rapi = await axios.get(config.get('RELAYER_API') + 'api/public')
        rapi = rapi.data
        const relayerName = {}
        for (let i = 0; i < rapi.payload.Relayers.length; i++) {
            relayerName[rapi.payload.Relayers[i].coinbase] = rapi.payload.Relayers[i].name
        }
        try {
            for (let i = 0; i < response.items.length; i++) {
                const dex = response.items[i].address
                let v24 = await axios.get(config.get('TOMODEX_API') + 'api/relayer/volume?relayerAddress=' + dex)
                v24 = v24.data
                response.items[i].volume24h = (new BigNumber(v24.data.totalVolume)).div(10 ** 6).toNumber()

                let l24 = await axios.get(config.get('TOMODEX_API') + 'api/relayer/lending?relayerAddress=' + dex)
                l24 = l24.data
                response.items[i].lending24h = (new BigNumber(l24.data.totalLendingVolume)).div(10 ** 6).toNumber()
                response.items[i].relayerName = relayerName[response.items[i].address]
            }
        } catch (e) {
            console.warn(e)
        }
        return res.json(response)
    } catch (e) {
        logger.warn('Get list account error %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

module.exports = RelayerController
