import api from './api'
import Web3Connector from './services/Web3Connector'
import CronTab from './services/CronTab'
import aclService from './services/Acl'
import authService from './services/Auth'
import aclStore from './helpers/aclStore'

const express = require('express')
const logger = require('morgan')
const compression = require('compression')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const cors = require('cors')

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

// Init acl and jwt.
app.use(authService.initialize())
authService.setJwtStrategy()

mongoose.connect(process.env.MONGODB_URI, (err) => {
  if (err) {
    console.log(
      'MongoDB Connection Error. Please make sure that MongoDB is running.')
    process.exit(1)
  }
  else {
    aclService(mongoose.connection.db)

    let acl = aclStore.acl

    // initialize api
    app.use('/api', api)

    app.all('*', authService.authenticate(), (req, res, next) => next())

    // Will return error message as a string -> "Insufficient permissions to access resource"
    app.use(acl.middleware.errorHandler('json'))
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
