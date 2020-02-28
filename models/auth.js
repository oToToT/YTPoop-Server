const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const accounts = require('./accounts');

passport.use(new LocalStrategy(function(username, password, done) {
    accounts.validate(username, password, function(row) {
        return done(null, row);
    });
}));

passport.serializeUser(function(user, done) {
    return done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    accounts.findUserById(id, function(row) {
        return done(null, row);
    });
});

module.exports = passport;
