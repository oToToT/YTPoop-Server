const express = require('express');
const router = express.Router();

router.get('/', function(req, res, next) {
    return res.render('home', { title: 'Express' });
});
router.get('/play', function(req, res, next) {
    return res.render('play');
});
router.get('/search', function(req, res, next) {
    return res.render('search');
});

module.exports = router;
