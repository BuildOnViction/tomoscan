import passport from 'passport'
import passportJwt from 'passport-jwt'

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
  const strategy = new passportJwt.Strategy(opts, (req, jwtPayload, done) => {
    const _id = jwtPayload.id

    User.findOne({_id}, (err, user) => {
      if (err) done(err, false)
      done(null, user || false)
    })
  })

  passport.use(strategy)
}

export default authService