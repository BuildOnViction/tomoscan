const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    meta_key: String, meta_value: String
}, {
    versionKey: false
})

let Setting = mongoose.model('Setting', schema)

export default Setting
