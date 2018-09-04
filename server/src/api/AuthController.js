import { Router } from 'express'
import db from '../models'
import EmailService from '../services/Email'

const AuthController = Router()

AuthController.post('/login', async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password

        let user = await db.User.findOne({ email: email })
        if (!user) {
            return res.status(404).json({ message: 'User not found!' })
        }

        let isMatch = await user.authenticate(password)

        if (!isMatch) {
            return res.status(400).json({ message: 'Password or email is incorrect!' })
        }

        let token = await user.generateToken(user)

        if (!token) { return res.sendStatus(400) }

        return res.json({ user, token })
    } catch (e) {
        return res.status(400).json(e)
    }
})

AuthController.post('/register', async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password

        let user = await db.User.findOne({ email: email })
        if (user) {
            return res.status(400).json({ message: 'Email exists in DB!' })
        }

        user = new db.User({
            email: email,
            password: password
        })
        let error = user.validateSync()
        if (error) {
            let message
            if (error.errors.password) {
                message = error.errors.password.message
            } else {
                message = 'Validation error!'
            }
            console.log('message', message)
            return res.status(400).json({ message: message })
        }
        await user.save()

        let token = await user.generateToken(user)

        // Send email welcome.
        let emailService = new EmailService()
        emailService.newUserRegister(user)

        return res.json({ user, token })
    } catch (e) {
        console.log('error: ', e)
        return res.status(400).json(e)
    }
})

export default AuthController
