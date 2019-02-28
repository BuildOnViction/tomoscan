const { Router } = require('express')
const axios = require('axios')
const db = require('../models')
const EmailService = require('../services/Email')
const config = require('config')

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
            return res.status(400).json({ message: 'Account already exists!' })
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

AuthController.post('/lostpw', async (req, res) => {
    try {
        const email = req.body.email
        const captchaToken = req.body.captchaToken

        let user = await db.User.findOne({ email })

        if (!captchaToken) {
            return res.json({ error: { message: 'Captcha is required' } })
        }

        const captchaValidation = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify?' +
                'secret=' + config.get('RE_CAPTCHA_SECRET') +
                '&response=' + captchaToken
        )

        if (!captchaValidation.data.success) {
            return res.json({ error: { message: 'Oops, something went wrong on our side' } })
        }

        // Send email forgot password.
        if (user) {
            // generate token
            const token = await user.generateToken(user, 'resetPwd')

            let emailService = new EmailService()
            emailService.recoverPassword(user, token)
        }

        return res.json({ message: 'Done' })
    } catch (e) {
        return res.status(400).json(e)
    }
})

AuthController.post('/tokenValidation', async (req, res) => {
    try {
        const email = req.body.email
        const token = req.body.token
        let user = await db.User.findOne({ email })

        if (!user) {
            return res.status(406).json({ error: { message: 'User not found!' } })
        }

        if (!token) {
            return res.status(406).json({ error: { message: 'Token not found!' } })
        }

        // Check if token has been used
        if (token === user.latestResetToken) {
            return res.status(406).json({ error: { message: 'The reset password link has expired' } })
        }

        const validation = await user.tokenDecoding(token)

        if (validation.error) {
            return res.status(406).json({ error: { message: 'The reset password link has expired' } })
        }

        return res.json({ message: 'All checked' })
    } catch (error) {
        return res.status(400).json({ error: { message: 'Something went wrong' } })
    }
})

AuthController.post('/reset-password', async (req, res) => {
    try {
        const email = req.body.email
        const password = req.body.password

        let user = await db.User.findOne({ email })
        let token = req.body.token

        if (!user) {
            return res.status(404).json({ error: { message: 'User not found!' } })
        }

        if (!token) {
            return res.status(404).json({ error: { message: 'Token not found!' } })
        }

        const validation = await user.tokenDecoding(token)

        // Check if token has been used
        if (validation.error || token === user.latestResetToken) {
            return res.status(406).json({ message: 'The reset password link has expired' })
        }

        if (await user.authenticate(password)) {
            return res.json({ error: { message: 'New password cannot be the same as old' } })
        }

        if (validation.email === email) {
            const hash = await user.encryptPassword(password)
            // Update new password and latestResetToken
            await db.User.update({ email: email }, { $set: { password: hash, latestResetToken: token } })

            // Send comfirmation email
            let emailService = new EmailService()
            emailService.resetEmailComfirmation(user)
            return res.json({ message: 'Password successfuly changed' })
        } else {
            return res.status(406).json({ message: 'Something went wrong' })
        }
    } catch (error) {
        return res.status(404).json({ message: 'Something went wrong' })
    }
})

module.exports = AuthController
