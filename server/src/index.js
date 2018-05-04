import api from './api'
import Web3Connector from './services/Web3Connector'
import CronTab from './services/CronTab'
import authService from './services/Auth'

const express = require('express')
const logger = require('morgan')
const compression = require('compression')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const cors = require('cors')
const bodyParser = require('body-parser')

// Load environment variables from .env file
dotenv.load()

const app = express()

// Init socket.io.
const server = require('http').createServer(app)
const io = require('socket.io')(server)

app.set('port', process.env.PORT || 3333)
app.use(compression())
app.use(logger('dev'))
app.use(cors())
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

// Init auth and jwt.
app.use(authService.initialize())
authService.setJwtStrategy()

mongoose.connect(process.env.MONGODB_URI, (err) => {
  if (err) {
    console.log(
      'MongoDB Connection Error. Please make sure that MongoDB is running.')
    process.exit(1)
  }
  else {
    // Apply auth for route group.
//    app.all('/api/*', authService.authenticate(), (req, res, next) => {
//      console.log(req.user)
//      return next()
//    })

    // Initialize public api
    app.use('/api', api)
  }
})
if (process.env.DEBUG_QUERY == true) {
  mongoose.set('debug', function (coll, method, query, doc, options) {
    let set = {
      coll: coll,
      method: method,
      query: query,
      doc: doc,
      options: options,
    }

    console.log({
      dbQuery: set,
    })
  })
}

// Production error handler
if (app.get('env') === 'production') {
  app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.sendStatus(err.status || 500)
  })
}

server.listen(app.get('port'), async () => {
  try {
    console.log('Start ws for web3.')
    Web3Connector.connect(io)

    console.log('Start cronjob.')
    CronTab.start()

    console.log('Express server listening on port ' + app.get('port'))
  }
  catch (e) {
    console.log(e)
    throw e
  }
})

module.exports = app
