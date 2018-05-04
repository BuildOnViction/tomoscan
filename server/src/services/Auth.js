import passport from 'passport'
import passportJwt from 'passport-jwt'
import User from '../models/User'

let authService = {
  initialize: () => passport.initialize(),
  authenticate: () => passport.authenticate('jwt',
    {session: false}),
  setJwtStrategy,
}

function setJwtStrategy () {
  const opts = {
    jwtFromRequest: passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
    passReqToCallback: true,
  }
  const strategy = new passportJwt.Strategy(opts, (req, jwtPayload, next) => {
    const _id = jwtPayload.id

    User.findOne({_id}, (err, user) => {
      if (err)
        next(err, false)

      // Append user to request.
      req.user = user

      next(null, user || false)
    })
  })

  passport.use(strategy)
}

export default authService