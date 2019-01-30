import api from './api'
import Web3Connector from './services/Web3Connector'
import authService from './services/Auth'

const express = require('express')
const events = require('events')
const logger = require('morgan')
const compression = require('compression')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')
const config = require('config')
const producer = require('./producer')
const fs = require('fs')
const yaml = require('js-yaml')
const swaggerUi = require('swagger-ui-express')

const app = express()
producer.watch()

// fix warning max listener
events.EventEmitter.defaultMaxListeners = 1000
process.setMaxListeners(1000)

// Init socket.io.
const server = require('http').createServer(app)
const io = require('socket.io')(server)

app.set('port', config.get('PORT') || 3333)
app.use(compression())
app.use(logger('dev'))
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

const docs = yaml.safeLoad(fs.readFileSync('./src/docs/swagger.yml', 'utf8'))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(docs))

// Init auth and jwt.
app.use(authService.initialize())
authService.setJwtStrategy()

mongoose.connect(config.get('MONGODB_URI'), { useNewUrlParser: true }, (err) => {
    if (err) {
        console.log(
            'MongoDB Connection Error. Please make sure that MongoDB is running.')
        process.exit(1)
    } else {
    // Initialize public api
        app.use('/api', api)

        // Production error handler
        if (config.get('APP_ENV') === 'prod') {
            app.use(function (err, req, res, next) {
                var slack = require('slack-notify')(config.get('SLACK_WEBHOOK_URL'))
                slack.send({
                    channel: '#tm_explorer',
                    text: err.stack
                })

                res.sendStatus(err.status || 500)
            })
        }
    }
})

if (config.get('DEBUG_QUERY') === true) {
    mongoose.set('debug', function (coll, method, query, doc, options) {
        let set = {
            coll: coll,
            method: method,
            query: query,
            doc: doc,
            options: options
        }

        console.log({
            dbQuery: set
        })
    })
}

server.listen(app.get('port'), async () => {
    try {
        console.log('Start ws for web3.')
        Web3Connector.connect(io)

        console.log('Express server listening on port ' + app.get('port'))
    } catch (e) {
        console.trace(e)
        return null
    }
})

module.exports = app
