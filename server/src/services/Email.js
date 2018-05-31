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
  }

  newUserRegister (user) {
    if (!user) {
      return false
    }

    return this.send('register', user.email, 'Welcome to TOMO Explorer', {
      name: user.email,
    })
  }

  followAlert (user, tx, address, type = 'received') {
    if (!user || !tx || !address)
      return false

    let subject = ''
    if (type === 'received') {
      subject = 'TOMO received at ' + address
    }
    else {
      subject = 'TOMO sent at ' + address
    }
    
    return this.send('follow', user.email, subject, {
      type: type,
      name: user.email,
      from: tx.from,
      to: tx.to,
      wei: tx.value,
      blockNumber: tx.blockNumber,
      txLink: process.env.CLIENT_URL + 'txs/' + tx.hash,
      addressLink: process.env.CLIENT_URL + 'address/' + address,
    })
  }

  async send (templatePath, to, subject, params) {
    if (process.env.APP_ENV === 'dev') {
      console.log(JSON.stringify({templatePath, to, subject, params}))
    }
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