'use strict'

const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Crawl = new Schema({
    type: String,
    data: String,
    crawl: Boolean
}, {
    timestamps: false,
    versionKey: false
})

module.exports = mongoose.model('Crawl', Crawl)
