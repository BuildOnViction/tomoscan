const { Router } = require('express')
const authService = require('../services/Auth')
const { paginate } = require('../helpers/utils')
const db = require('../models')
const FollowHelper = require('../helpers/follow')

const FollowController = Router()

FollowController.get('/follows', authService.authenticate(),
    async (req, res, next) => {
        try {
            const user = req.user
            if (!user) {
                return res.sendStatus(401)
            }

            const params = {}
            params.query = {
                user: user.id
            }
            const data = await paginate(req, 'Follow', params)
            const items = data.items
            data.items = await FollowHelper.formatItems(items)

            return res.json(data)
        } catch (e) {
            console.trace(e)
            console.log(e)
            return res.status(400).send()
        }
    })

FollowController.post('/follows', authService.authenticate(),
    async (req, res, next) => {
        try {
            const user = req.user
            if (!user) {
                return res.sendStatus(401)
            }

            const lastBlock = await db.Block.findOne().sort({ number: -1 })
            const blockNumber = lastBlock ? lastBlock.number : 0
            const follow = await FollowHelper.firstOrUpdate(req, user, blockNumber)

            return res.json(follow)
        } catch (e) {
            console.trace(e)
            console.log(e)
            return res.status(400).send()
        }
    })

FollowController.post('/follows/:id', authService.authenticate(),
    async (req, res, next) => {
        try {
            const user = req.user

            if (!user) {
                return res.sendStatus(401)
            }

            const id = req.params.id
            const follow = await db.Follow.findOne({ _id: id, user: user._id })
            if (!follow) {
                return res.sendStatus(404)
            }

            follow.notifyReceive = req.body.notifyReceive
            follow.notifySent = req.body.notifySent
            follow.sendEmail = req.body.sendEmail
            await follow.save()

            return res.json(follow)
        } catch (e) {
            console.trace(e)
            console.log(e)
            return res.status(400).send()
        }
    })

FollowController.delete('/follows/:id', authService.authenticate(),
    async (req, res, next) => {
        try {
            const user = req.user

            if (!user) {
                return res.sendStatus(401)
            }

            const id = req.params.id
            const follow = await db.Follow.findOneAndRemove(
                { _id: id, user: user._id })

            return res.json(follow)
        } catch (e) {
            console.trace(e)
            console.log(e)
            return res.status(400).send()
        }
    })

module.exports = FollowController
