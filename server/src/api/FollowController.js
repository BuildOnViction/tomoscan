import { Router } from 'express'
import authService from '../services/Auth'
import mongoose from 'mongoose'
import { paginate } from '../helpers/utils'
import Follow from '../models/Follow'
import FollowRepository from '../repositories/FollowRepository'
import User from '../models/User'

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
      console.log(e)
      throw e
    }
  })

FollowController.post('/follows', authService.authenticate(),
  async (req, res, next) => {
    try {
      let user = req.user
      if (!user) {
        return res.sendStatus(401)
      }

      let follow = await FollowRepository.firstOrUpdate(req, user)

      return res.json(follow)
    }
    catch (e) {
      console.log(e)
      throw e
    }
  })

export default FollowController