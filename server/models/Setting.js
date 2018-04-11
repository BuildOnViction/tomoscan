const mongoose = require('mongoose')
const Schema = mongoose.Schema

const schema = new mongoose.Schema({
  meta_key: String, meta_value: String,
})

module.exports = mongoose.model('Setting', schema)