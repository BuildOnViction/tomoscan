import { Router } from 'express'
import authService from '../services/Auth'
import mongoose from 'mongoose'
import { paginate } from '../helpers/utils'
import Follow from '../models/Follow'
import FollowRepository from '../repositories/FollowRepository'
import User from '../models/User'
import Block from '../models/Block'

const FollowController = Router()

FollowController.get('/follows', authService.authenticate(),
  async (req, res, next) => {
    try {
      let user = req.user
      if (!user) {
        return res.sendStatus(401)
      }

      let params = {}
      params.query = {
        user: user.id,
      }
      let data = await paginate(req, 'Follow', params)
      let items = data.items
      data.items = await FollowRepository.formatItems(items)

      return res.json(data)
    }
    catch (e) {
      console.trace(e)
      console.log(e)
      return res.status(500).send()
    }
  })

FollowController.post('/follows', authService.authenticate(),
  async (req, res, next) => {
    try {
      let user = req.user
      if (!user) {
        return res.sendStatus(401)
      }

      let lastBlock = await Block.findOne().sort({number: -1})
      let blockNumber = lastBlock ? lastBlock.number : 0
      let follow = await FollowRepository.firstOrUpdate(req, user, blockNumber)

      return res.json(follow)
    }
    catch (e) {
      console.trace(e)
      console.log(e)
      return res.status(500).send()
    }
  })

FollowController.post('/follows/:id', authService.authenticate(),
  async (req, res, next) => {
    try {
      let user = req.user

      if (!user) {
        return res.sendStatus(401)
      }

      let id = req.params.id
      let follow = await Follow.findOne({_id: id, user: user._id})
      if (!follow) {
        return res.sendStatus(404)
      }

      follow.notifyReceive = req.body.notifyReceive
      follow.notifySent = req.body.notifySent
      follow.sendEmail = req.body.sendEmail
      await follow.save()

      return res.json(follow)
    }
    catch (e) {
      console.trace(e)
      console.log(e)
      return res.status(500).send()
    }
  })

FollowController.delete('/follows/:id', authService.authenticate(),
  async (req, res, next) => {
    try {
      let user = req.user

      if (!user) {
        return res.sendStatus(401)
      }

      let id = req.params.id
      let follow = await Follow.findOneAndRemove(
        {_id: id, user: user._id})

      return res.json(follow)
    }
    catch (e) {
      console.trace(e)
      console.log(e)
      return res.status(500).send()
    }
  })

export default FollowController