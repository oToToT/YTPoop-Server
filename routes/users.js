const passport = require('../models/auth')
const accounts = require('../models/accounts')
const express = require('express');
const router = express.Router();

function preventMultipleLogin(req, res, next) {
    if (typeof req.user !== 'undefined') {
        return res.redirect('/');
    }
    return next();
}

router.get('/login', preventMultipleLogin, function(req, res, next) {
    return res.render('login_register', { 
        title: 'Login',
        error: req.flash('error'),
        layout: 'login'
    });
});

router.get('/register', preventMultipleLogin, function(req, res, next) {
    return res.render('login_register', {
        title: 'Register',
        error: req.flash('error'),
        layout: 'register'
    });
});

router.get('/logout', function(req, res, next) {
    req.logout();
    return res.redirect('/');
});

router.get('/history', function(req, res, next) {
    return res.render('index', { title: 'History' });
})

router.post('/login', preventMultipleLogin, passport.authenticate('local', {
    failureRedirect: '/users/login',
    failureFlash: true
}), function(req, res, next){
    return res.redirect('/');
});

router.post('/register', preventMultipleLogin, function(req, res, next) {
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
    accounts.register(req.body.username, req.body.password, function(id, msg) {
        if (id === false) {
            req.flash('error', msg);
            return res.redirect('/users/register');
        }
        req.login({
            username: req.body.username,
            id: id
        }, function(err) {
            if (err) return next(err);
            return res.redirect('/');
        });
    });
});

module.exports = router;
