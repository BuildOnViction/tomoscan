const { Router } = require('express')
const { BigNumber } = require('bignumber.js')
const axios = require('axios')
const config = require('config')
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
        let relayers = await axios.get(config.get('TOMODEX_API') + 'api/relayer/all')
        relayers = relayers.data.data
        for (let i = 0; i < relayers.length; i++) {
            let lending24h = new BigNumber(relayers[i].lendingVolume)
            lending24h = lending24h.div(10 ** 6).toNumber()
            let volume24h = new BigNumber(relayers[i].spotVolume)
            volume24h = volume24h.div(10 ** 6).toNumber()
            relayers[i].lending24h = lending24h
            relayers[i].volume24h = volume24h
        }
        return res.json(relayers)
    } catch (e) {
        logger.warn('Get list account error %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

module.exports = RelayerController
