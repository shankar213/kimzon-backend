const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const utils = require('./utils')
const UserDetails = mongoose.model(utils.dbCons.COLLECTION_USERS)

passport.use('login', new LocalStrategy({
        usernameField: 'email'
    },
    async function (email, password, done) {

        const user = await UserDetails.findOne({email: email})

        if (!user)
            return done(null, false, {message: 'User does not exist with giveb emailId'})

        // Return if password is wrong
        if (!user.validPassword(password)) {
            return done(null, false, {message: 'Invalid Password'})
        }
        // If credentials are correct, return the user object
        return done(null, user, {message: 'Logged in successfully'})

    }
))
