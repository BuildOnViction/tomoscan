const { Router } = require('express')
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
        const data = {
            total: total,
            perPage: limit,
            currentPage: currentPage,
            pages: pages,
            items: relayers
        }

        return res.json(data)
    } catch (e) {
        logger.warn('Get list account error %s', e)
        return res.status(500).json({ errors: { message: 'Something error!' } })
    }
})

module.exports = RelayerController
