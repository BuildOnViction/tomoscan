import { Router } from 'express'
import authService from '../services/Auth'
import mongoose from 'mongoose'
import { paginate } from '../helpers/utils'
import Follow from '../models/Follow'
import FollowRepository from '../repositories/FollowRepository'

const FollowController = Router()

FollowController.get('/follows', authService.authenticate(),
  async (req, res, next) => {
    try {
      let user = req.user
      if (!user) {
        return res.sendStatus(401)
      }

      let params = {}
      params.query = {user: new mongoose.Types.ObjectId(user.id)}
      let data = paginate(req, 'Follow', params)

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

      let follow = await FollowRepository.firstOrUpdate(req)
      
      return res.json(follow)
    }
    catch (e) {
      console.log(e)
      throw e
    }
  })

export default FollowController