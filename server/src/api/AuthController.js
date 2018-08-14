import { Router } from 'express'
import db from '../models'
import EmailService from '../services/Email'

const AuthController = Router()

AuthController.post('/login', async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password

        let user = await db.User.findOne({ email: email })
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

        let user = await db.User.findOne({ email: email })
        if (user) { return res.status(422).json({ message: 'Email exists in DB!' }) }

        user = await db.User.create({
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
