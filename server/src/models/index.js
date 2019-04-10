'use strict'

const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const config = require('config')
const db = {}
const logger = require('../helpers/logger')

mongoose.Promise = global.Promise
mongoose.connect(config.get('MONGODB_URI'),
    { useCreateIndex: true, useNewUrlParser: true, autoReconnect: true }, (err) => {
        if (err) {
            console.log('MongoDB Connection Error. Please make sure that MongoDB is running.')
            process.exit(1)
        }
    })
mongoose.connection.on('connecting', function () {
    logger.info('connecting to MongoDB...')
})

mongoose.connection.on('error', function (error) {
    logger.warn('Error in MongoDb connection: ' + error)
    mongoose.disconnect()
})
mongoose.connection.on('connected', function () {
    logger.info('MongoDB connected!')
})
mongoose.connection.once('open', function () {
    logger.info('MongoDB connection opened!')
})
mongoose.connection.on('reconnected', function () {
    logger.info('MongoDB reconnected!')
})
mongoose.connection.on('disconnected', function () {
    logger.info('MongoDB disconnected!')
    mongoose.connect(config.get('MONGODB_URI'), { useCreateIndex: true, useNewUrlParser: true, autoReconnect: true })
})

// import all file in this dir, except index.js
fs.readdirSync(__dirname)
    .filter(function (file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js') && (file.indexOf('.map') < 0)
    })
    .forEach(function (file) {
        let model = require(path.join(__dirname, file))
        db[model.modelName] = model
    })

db.mongoose = mongoose
module.exports = db
