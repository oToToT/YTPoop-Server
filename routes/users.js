const passport = require('../models/auth')
const accounts = require('../models/accounts')
const express = require('express');
const router = express.Router();

router.get('/login', function(req, res, next) {
    return res.render('index', { title: req.user ? req.user.username : 'Login' });
});

router.get('/register', function(req, res, next) {
    return res.render('index', { title: 'Register' });
});

router.get('/logout', function(req, res, next) {
    req.logout();
    return res.redirect('/');
});

router.post('/login', passport.authenticate('local', {
    failureRedirect: '/users/login'
}), function(req, res, next){
    console.log(req.user);
    return res.redirect('/');
});

router.post('/register', function(req, res, next) {
    if (!req.body.username) {
        req.flash('error', 'username is required.');
        return res.redirect('/users/register');
    }
    if (typeof req.body.username !== 'string') {
        req.flash('error', 'username should be string.')
        return res.redirect('/users/register');
    }
    if (!req.body.password) {
        req.flash('error', 'password is required.');
        return res.redirect('/users/register');
    }
    if (typeof req.body.password !== 'string') {
        req.flash('error', 'username should be string.')
        return res.redirect('/users/register');
    }
    accounts.register(req.body.username, req.body.password, function(id) {
        return res.render('index', { title: id });
    });
});

module.exports = router;
