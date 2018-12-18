import nodemailer from 'nodemailer'
import sgTransport from 'nodemailer-sendgrid-transport'
import path from 'path'
import Email from 'email-templates'
const config = require('config')
const urlJoin = require('url-join')

class EmailService {
    constructor () {
        const options = {
            auth: {
                api_key: config.get('SENDGRID_API_KEY')
            }
        }
        this.transporter = nodemailer.createTransport(sgTransport(options))
        this.templateDir = path.join(__dirname, '../', 'templates')
        this.assetDir = path.join(__dirname, '../', 'assets')
    }

    newUserRegister (user) {
        if (!user) {
            return false
        }

        return this.send('register', user.email, 'Welcome to TOMO Explorer', {
            name: user.email
        })
    }

    followAlert (user, tx, address, type = 'received') {
        if (!user || !tx || !address) { return false }

        let subject = ''
        if (type === 'received') {
            subject = 'TOMO received at ' + address
        } else {
            subject = 'TOMO sent at ' + address
        }

        return this.send('follow', user.email, subject, {
            type: type,
            name: user.email,
            from: tx.from,
            to: tx.to,
            wei: tx.value,
            blockNumber: tx.blockNumber,
            txLink: urlJoin(config.get('CLIENT_URL'), 'txs/', tx.hash),
            addressLink: urlJoin(config.get('CLIENT_URL'), 'address/', address)
        })
    }

    async send (templatePath, to, subject, params) {
        if (config.get('APP_ENV') === 'dev') {
            console.log(JSON.stringify({ templatePath, to, subject, params }))
        }
        let email = new Email({
            views: { root: this.templateDir },
            preview: false,
            juice: true,
            juiceResources: {
                preserveImportant: true,
                webResources: {
                    relativeTo: this.assetDir
                }
            },
            transport: this.transporter,
            send: true,
            message: {
                from: `TomoChain <${config.get('SENDER_EMAIL')}>`
            }
        })

        let result = await email.send({
            template: templatePath,
            message: {
                to: to,
                subject: subject
            },
            locals: params
        })

        return result
    }

    async recoverPassword (user, token) {
        if (!user) {
            return false
        }
        const url = config.get('CLIENT_URL')

        return this.send('reset-password', user.email, 'Reset Your Password', {
            name: user.email,
            link: `${url}accounts/reset-password?email=${user.email}&token=${token}`
        })
    }

    async resetEmailComfirmation (user) {
        if (!user) {
            return false
        }

        return this.send('reset-pw-comfirmation', user.email, 'Your Password Has Been Updated', {
            name: user.email
        })
    }
}

module.exports = EmailService
