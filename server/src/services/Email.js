import nodemailer from 'nodemailer'
import sgTransport from 'nodemailer-sendgrid-transport'
import path from 'path'
import Email from 'email-templates'

class EmailService {
  constructor () {
    const options = {
      auth: {
        api_key: process.env.SENDGRID_API_KEY,
      },
    }
    this.transporter = nodemailer.createTransport(sgTransport(options))
    this.templateDir = path.join(__dirname, '../', 'templates')
    this.assetDir = path.join(__dirname, '../', 'assets')
    console.info('email templates Dir ', this.templateDir)
  }

  newUserRegister (user) {
    if (!user) {
      return false
    }

    return this.send('register', user.email, 'Welcome to TOMO Explorer', {
      name: user.email,
    })
  }

  async send (templatePath, to, subject, params) {
    let email = new Email({
      views: {root: this.templateDir},
      preview: false,
      juice: true,
      juiceResources: {
        preserveImportant: true,
        webResources: {
          relativeTo: this.assetDir,
        },
      },
      transport: this.transporter,
      send: true,
      message: {
        from: process.env.SENDER_EMAIL,
      },
    })

    return await email.send({
      template: templatePath,
      message: {
        to: to,
        subject: subject,
      },
      locals: params,
    })
  }
}

export default EmailService