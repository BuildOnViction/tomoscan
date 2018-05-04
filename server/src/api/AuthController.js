import { Router } from 'express'
import User from '../models/User'

const AuthController = Router()

AuthController.post('/login', async (req, res) => {
  try {
    const email = req.body.email
    const password = req.body.password

    let user = await User.findOne({email: email})
    if (!user)
      return res.sendStatus(404)

    let isMatch = await user.authenticate(password)

    if (!isMatch)
      return res.sendStatus(422)

    let token = await user.generateToken(user)

    if (!token)
      return res.sendStatus(422)

    return res.json({user, token})
  }
  catch (e) {
    console.log(e)
    return res.sendStatus(422)
  }
})

AuthController.post('/register', async (req, res) => {
  try {
    const email = req.body.email
    const password = req.body.password

    let user = await User.findOne({email: email})
    if (user)
      return res.status(422).json({message: 'Email exists in DB!'})

    user = await User.create({
      email: email,
      password: password,
    })

    if (!user)
      return res.sendStatus(422)

    let token = await user.generateToken(user)

    return res.json({user, token})
  }
  catch (error) {
    console.log(error)
    return res.status(422).json({error})
  }
})

export default AuthController