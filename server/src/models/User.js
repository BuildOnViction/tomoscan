'use strict'

const bcrypt = require('bcrypt-nodejs')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const jwt = require('jsonwebtoken')
const config = require('config')

const User = new Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: {
        type: String,
        validate: {
            validator (v) {
                // Minimum 6 characters at least 1 Alphabet and 1 Number:
                return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/.test(v)
            },
            message: 'Password must be at least 6 characters long and contain at least 1 alphabet & 1 number'
        }
    }
}, {
    timestamps: true,
    versionKey: false
})

User.pre('save', function (callback) {
    let user = this

    if (user.isModified('password')) {
        user.password = bcrypt.hashSync(user.password, config.get('APP_SECRET'))
    }

    callback()
})

User.methods.authenticate = async function (password) {
    let user = this
    let hash = bcrypt.hashSync(password, config.get('APP_SECRET'))

    return user.password === hash
}

User.methods.generateToken = async function (user) {
    if (!user) { return false }
    const payload = {
        id: user._id,
        email: user.email
    }

    const options = {
        expiresIn: 10080 * 1000
    }

    const token = jwt.sign(payload, config.get('JWT_SECRET'), options)

    return token ? `bearer ${token}` : false
}

User.methods.toJSON = function () {
    let obj = this.toObject()

    delete obj.password

    return obj
}

module.exports = mongoose.model('User', User)
