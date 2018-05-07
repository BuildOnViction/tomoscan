import { Router } from 'express'
import authService from '../services/Auth'

const FollowController = Router()

FollowController.get('/follows', authService.authenticate(),
  async (req, res, next) => {
    try {
      let user = req.user
      let params = {}
      params.query
      return res.json({ok: '1'})
    }
    catch (e) {
      console.log(e)
      throw e
    }
  })

export default FollowController