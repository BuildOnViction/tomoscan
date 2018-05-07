const bcrypt = require('bcrypt-nodejs')
const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const Schema = mongoose.Schema

const schema = new mongoose.Schema({
  name: String,
  email: {type: String, unique: true, required: true},
  password: {
    type: String,
    validate: {
      validator (v) {
        // Minimum 6 characters at least 1 Alphabet and 1 Number:
        return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(v)
      },
      message: 'Minimum 6 characters at least 1 alphabet and 1 Number',
    },
  },
}, {
  timestamps: true,
})

schema.pre('save', function (callback) {
  let user = this

  if (user.isModified('password')) {
    user.password = bcrypt.hashSync(user.password, process.env.APP_SECRET)
  }

  callback()
})

schema.methods.authenticate = async function (password) {
  let user = this
  let hash = bcrypt.hashSync(password, process.env.APP_SECRET)

  return user.password == hash
}

schema.methods.generateToken = async function (user) {
  if (!user)
    return false
  const payload = {
    id: user._id,
    email: user.email,
  }

  const options = {
    expiresIn: 10080 * 1000,
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET, options)

  return token ? `bearer ${token}` : false
}

schema.methods.toJSON = function () {
  let obj = this.toObject()

  delete obj.password

  return obj
}

let User = mongoose.model('User', schema)

export default User