'use strict'

const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const config = require('config')
const db = {}

mongoose.Promise = global.Promise
mongoose.connect(config.get('MONGODB_URI'), { useNewUrlParser: true }, (err) => {
    if (err) {
        console.log('MongoDB Connection Error. Please make sure that MongoDB is running.')
        process.exit(1)
    }
})

// import all file in this dir, except index.js
fs.readdirSync(__dirname)
    .filter(function (file) {
        return (file.indexOf('.') !== 0) && (file !== 'index.js')
    })
    .forEach(function (file) {
        let model = require(path.join(__dirname, file))
        db[model.modelName] = model
    })

db.mongoose = mongoose
module.exports = db
