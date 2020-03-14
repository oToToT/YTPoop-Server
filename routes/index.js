const express = require('express');
const router = express.Router();
const songs = require('../models/songs');
const accounts = require('../models/accounts');
const histories = require('../models/histories');
const qs = require('querystring');

function ensureParam(key, field = 'query') {
    return (req, res, next)=>{
        if (typeof req[field][key] === 'undefined' || req[field][key] === '') {
            return res.redirect(req.headers['referer'] || '/');
        }
        return next();
    };
}

router.get('/', function(req, res, next) {
    return res.render('index', {
        user: req.user,
        songs: songs.randomSample(50)
    });
});

function extractVid(param) {
    return (req, res, next) => {
        let id = 0;
        try {
            id = Buffer.from(req.query[param], 'base64').toString('ascii');
            id = Number(id);
            if (isNaN(id)) {
                throw 'Bad id.';
            }    
        } catch(e) {
            return res.redirect(req.headers['referer'] || '/');
        }
        req.sid = id;
        return next();
    }
}

router.get('/watch',
    ensureParam('v'),
    extractVid('v'),
    function(req, res, next) {
        let song = null;
        try {
            song = songs.getSongById(req.sid);
        } catch(e) {
            return res.redirect('/');
        }
        const renderPage = (a, b, c, d)=>{
            console.log(8.97777+a, 8.333333333333333e-10+b, -200+c, -3+d);
            return res.render('watch', {
                user: req.user,
                song: song,
                recommend: songs.getRecommend(req.sid, 8.97777+a, 8.333333333333333e-10+b, -200+c, -3+d, 20)
            });
        }
        // this may have race condition problem
        const updWeight = (cb)=>{
            histories.get(req.user.id, (rows, msg)=>{
                if (rows === false) throw msg;
                // should check host carefully
                let [a, b, c, d] = [0, 0, 0, 0];
                let hist = rows.slice(-20);
                for (let i = hist.length - 1; i >= 0; --i) {
                    for (let j = hist.length - 1; j >= i; --j) {
                        let [da, db, dc, dd] = songs.pairWeight(
                            songs.getSongById(hist[i].sid),
                            songs.getSongById(hist[j].sid)
                        );
                        da *= -5e-3 * Math.pow(0.9, j - i);
                        db *= -1e-13 * Math.pow(0.9, j - i);
                        dc *= -5e-1 * Math.pow(0.9, j - i);
                        dd *= -1e-5 * Math.pow(0.9, j - i);
                        a += da;
                        b += db;
                        c += dc;
                        d += dd;
                    }
                }
                accounts.updateParam(req.user.id, a, b, c, d, (changes, m)=>{
                    if (changes === false) throw m;
                    return cb(a, b, c, d);
                });
            });
        };
        if (req.user) {
            histories.save(req.user.id, req.sid, (lastID, msg)=>{
                if (lastID === false) throw msg;
                updWeight((a, b, c, d)=>{
                    console.log(a, b, c, d);
                    renderPage(a, b, c, d);
                });
            });
        } else {
            renderPage(0, 0, 0, 0);
        }
   }
);

router.get('/results', ensureParam('q'), async function(req, res, next) {
    let result = await songs.searchAll(req.query.q, limits=100);
    return res.render('results', {
        user: req.user,
        search: req.query.q,
        result: result
    });
});
router.post('/results',
    ensureParam('q', 'body'),
    ensureParam('m', 'body'),
    async function(req, res, next) {
        let result = [];
        if (req.body.m === "all") {
            result = await songs.searchAll(req.body.q, limits=100);
        } else if (req.body.m === "name") {
            result = await songs.searchByName(req.body.q, limits=100);
        } else if (req.body.m === "singer") {
            result = await songs.searchBySinger(req.body.q, limits=100);
        } else if (req.body.m === "lyrics") {
            result = await songs.searchByLyrics(req.body.q, limits=100);
        }
        return res.json(result);
    }
);

router.get("/search", async function(req, res, next) {
    let result = await songs.searchAll(req.query.q, limits=100);
    return res.render('search', {
        user: req.user,
        result: result,
        search: req.query.q
    });
});

router.get("/reco", ensureParam("v"), function(req, res, next) {
    let id = Buffer.from(req.query.v, 'base64').toString('ascii');
    id = Number(id);
    return res.render('reco', {
        id: id,
        song: songs.getSongById(id)
    });
});

router.post("/reco", function(req, res, next) {
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
