const path = require('path')
const config = require('config')
const urlJoin = require('url-join')
const sgMail = require('@sendgrid/mail')
const fs = require('fs')
const format = require('string-template')

class EmailService {
    newUserRegister (user) {
        if (!user) {
            return false
        }

        return this.send('register.html', user.email, 'Welcome to TomoScan', {
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

        return this.send('follow.html', user.email, subject, {
            type: type,
            name: user.email,
            from: tx.from,
            to: tx.to,
            wei: tx.value,
            blockNumber: tx.blockNumber,
            txLink: urlJoin(config.get('CLIENT_URL'), 'txs', tx.hash),
            addressLink: urlJoin(config.get('CLIENT_URL'), 'address', address)
        })
    }

    async send (templateFile, to, subject, params) {
        sgMail.setApiKey(config.get('SENDGRID_API_KEY'))
        let stringTemplate = fs.readFileSync(path.join(__dirname, '../', 'templates', templateFile), 'utf8')
        let body = format(stringTemplate, params)
        const msg = {
            to: 'khaihkd@gmail.com',
            from: 'admin@tomochain.com',
            subject: subject,
            html: body
        }
        return sgMail.send(msg)
    }

    async recoverPassword (user, token) {
        if (!user) {
            return false
        }
        const url = config.get('CLIENT_URL')

        return this.send('reset-password.html', user.email, 'Reset Your Password', {
            name: user.email,
            link: `${url}accounts/reset-password?email=${user.email}&token=${token}`
        })
    }

    async resetEmailComfirmation (user) {
        if (!user) {
            return false
        }

        return this.send('reset-pw-confirmation.html', user.email, 'Your Password Has Been Updated', {
            name: user.email
        })
    }
}

module.exports = EmailService
