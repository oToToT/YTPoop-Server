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
            return res.render('watch', {
                user: req.user,
                song: song,
                recommend: songs.getRecommend(req.sid, 8.97777+a, 8.333333333333333e-10+b, -200+c, -3+d, 20)
            });
        }
        // this may have race condition problem
        const updWeight = (cb)=>{
            accounts.getParam(req.user.id, (row, msg)=>{
                if (row === false) throw msg;
                if (!req.headers['referer']) {
                    return cb(row.a, row.b, row.c, row.d);
                }
                let u = new URL(req.headers['referer']);
                // should check host carefully
                if (!u.search) {
                    return cb(row.a, row.b, row.c, row.d);
                }
                let que = qs.parse(u.search.slice(1));
                if (!que['v']) {
                    return cb(row.a, row.b, row.c, row.d);
                }
                let id = Number(Buffer.from(que['v'], 'base64').toString('ascii'));
                let s1 = songs.getSongById(id);
                let [a, b, c, d] = songs.pairWeight(song, s1);
                a *= -5e-3;
                b *= -1e-13;
                c *= -5e1;
                d *= -1e-5;
                //a=0,b=0,c=0,d=0;
                a += row.a;
                b += row.b;
                c += row.c;
                d += row.d;
                accounts.updateParam(req.user.id, a, b, c, d, (changes, m)=>{
                    if (changes === false) throw m;
                    return cb(a, b, c, d);
                });
            });
        };
        if (req.user) {
            updWeight((a, b, c, d)=>{
                histories.save(req.user.id, req.sid, (lastID, msg)=>{
                    if (lastID === false) throw msg;
                    console.log(a, b, c, d);
                    renderPage(a, b, c, d);
                });
            });
        } else {
            renderPage(0, 0, 0, 0);
        }
   }
);

router.get("/results", ensureParam("q"), async function(req, res, next) {
    let result = await songs.searchAll(req.query.q, limits=100);
    return res.render('results', {
        user: req.user,
        search: req.query.q,
        result: result
    });
});
router.post("/results",
    ensureParam("q", "body"),
    ensureParam("m", "body"),
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
