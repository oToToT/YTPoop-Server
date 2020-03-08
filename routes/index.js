const express = require('express');
const router = express.Router();
const songs = require('../models/songs');

router.get('/', function(req, res, next) {
    return res.render('index', {
        user: req.user,
        songs: songs.randomSample(50)
    });
});

router.get('/watch', function(req, res, next) {
    if (typeof req.query.v === 'undefined') {
        return res.redirect('/');
    }
    let id = 0;
    try {
        id = Buffer.from(req.query.v, 'base64').toString('ascii');
        id = Number(id);
        if (isNaN(id)) {
            throw "Bad id.";
        }
        return res.render('watch', {
            user: req.user,
            song: songs.getSongById(id),
            recommend: songs.getRecommend(id, 11.97777, 8.333333333333333e-9, -2, -3, 20)
        });
    } catch(e) {
        return res.redirect('/');
    }
});

router.get('/search', async function(req, res, next) {
    if (typeof req.query.q === 'undefined') {
        return res.redirect('/');
    }
    return res.render('search', {
        user: req.user,
        search: req.query.q
    });
});

router.get('/results', async function(req, res, next) {
    let result = await songs.search(req.query.q, limits=100);
    return res.render('result', {
        user: req.user,
        result: result,
        search: req.query.q
    });
});

router.get('/reco', function(req, res, next) {
    let id = Buffer.from(req.query.v, 'base64').toString('ascii');
    id = Number(id);
    return res.render('reco', {
        id: id,
        song: songs.getSongById(id)
    });
});

router.post('/reco', function(req, res, next) {
    let id = Number(req.body.id);
    let a = Number(req.body.a);
    let b = Number(req.body.b);
    let c = Number(req.body.c);
    let d = Number(req.body.d);
    let K = Number(req.body.K);
    return res.json({
        result: songs.getRecommend(id, a, b, c, d, K)
    });
});

module.exports = router;
