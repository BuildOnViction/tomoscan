import { Router } from 'express'
import User from '../models/User'
import EmailService from '../services/Email'

const AuthController = Router()

AuthController.post('/login', async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password

        let user = await User.findOne({ email: email })
        if (!user) { return res.sendStatus(401) }

        let isMatch = await user.authenticate(password)

        if (!isMatch) { return res.sendStatus(422) }

        let token = await user.generateToken(user)

        if (!token) { return res.sendStatus(422) }

        return res.json({ user, token })
    } catch (e) {
        return res.status(422).json(e)
    }
})

AuthController.post('/register', async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password

        let user = await User.findOne({ email: email })
        if (user) { return res.status(422).json({ message: 'Email exists in DB!' }) }

        user = await User.create({
            email: email,
            password: password
        })

        if (!user) { return res.sendStatus(422) }

        let token = await user.generateToken(user)

        // Send email welcome.
        let emailServoce = new EmailService()
        emailServoce.newUserRegister(user)

        return res.json({ user, token })
    } catch (e) {
        return res.status(422).json(e)
    }
})

export default AuthController
