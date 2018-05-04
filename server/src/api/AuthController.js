import { Router } from 'express'
import User from '../models/User'

const AuthController = Router()

AuthController.post('/login', async (req, res) => {
  try {
    const email = req.body.email
    const password = req.body.password

    let user = await User.findOne({email: email})
    if (!user)
      return res.status(422)

    let isMatch = await user.authenticate(password)

    if (!isMatch)
      return res.sendStatus(422)

    let token = await user.generateToken(user)

    if (!token)
      return res.sendStatus(422)

    return res.json({user, token})
  }
  catch (e) {
    return res.sendStatus(422)
  }
})

AuthController.post('/register', async (req, res) => {
  try {
    const email = req.body.email
    const password = req.body.password

    let user = await User.findOne({email: email})
    if (user)
      return res.sendStatus(422)

    user = await User.create({
      email: email,
      password: password,
    })

    if (!user)
      return res.sendStatus(422)

    token = await user.generateToken()

    return res.json({user, token})
  }
  catch (error) {
    return res.status(422).json({error})
  }
})

export default AuthController