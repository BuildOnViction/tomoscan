const passport = require('passport')
const passportJwt = require('passport-jwt')
const User = require('../models/User')
const config = require('config')

let authService = {
    initialize: () => passport.initialize(),
    authenticate: () => passport.authenticate('jwt',
        { session: false }),
    setJwtStrategy
}

function setJwtStrategy () {
    const opts = {
        jwtFromRequest: passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: config.get('JWT_SECRET'),
        passReqToCallback: true
    }
    const strategy = new passportJwt.Strategy(opts,
        (req, jwtPayload, next) => {
            const _id = jwtPayload.id

            User.findOne({ _id }, (err, user) => {
                if (err) {
                    return next(err, false)
                }

                // Append user to request.
                req.user = user

                return next(null, user || false)
            })
        })

    passport.use(strategy)
}

module.exports = authService
