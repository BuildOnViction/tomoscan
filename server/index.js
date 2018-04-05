import api from './api'
import { Nuxt, Builder } from 'nuxt'

const express = require('express')
const logger = require('morgan')
const compression = require('compression')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

// Load environment variables from .env file
dotenv.load()

const app = express()

mongoose.connect(process.env.MONGODB_URI)
mongoose.connection.on('error', function () {
  console.log(
    'MongoDB Connection Error. Please make sure that MongoDB is running.')
  process.exit(1)
})
if(process.env.DEBUG_QUERY == true) {
  mongoose.set('debug', function(coll, method, query, doc, options) {
    let set = {
      coll: coll,
      method: method,
      query: query,
      doc: doc,
      options: options
    };

    console.log({
      dbQuery: set
    });
  });
}

app.set('port', process.env.PORT || 3000)
app.use(compression())
app.use(logger('dev'))

app.use('/api', api)

// Production error handler
if (app.get('env') === 'production') {
  app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.sendStatus(err.status || 500)
  })
}

// Import and Set Nuxt.js options
let config = require('../nuxt.config.js')
config.dev = !(
  process.env.NODE_ENV === 'production'
)

// Init Nuxt.js
const nuxt = new Nuxt(config)

// Build only in dev mode
//if (config.dev) {
//  const builder = new Builder(nuxt)
//  builder.build()
//}

// Give nuxt middleware to express
app.use(nuxt.render)

app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'))
})

module.exports = app
