const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    console.log(req.user);
    return res.render('home', { user: req.user });
});
router.get('/play', function(req, res, next) {
    return res.render('play', { user: req.user });
});
router.get('/search', function(req, res, next) {
    return res.render('search', { user: req.user });
});

module.exports = router;
