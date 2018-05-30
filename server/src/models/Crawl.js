const mongoose = require('mongoose')

const schema = new mongoose.Schema({
  type: String,
  data: String,
  crawl: Boolean
}, {
  timestamps: false,
  versionKey: false,
})

let Crawl = mongoose.model('Crawl', schema)

export default Crawl