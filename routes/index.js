const express = require('express');
const router = express.Router();
const songs = require('../models/songs');
const accounts = require('../models/accounts');
const histories = require('../models/histories')

function ensureParam(key, field = "query") {
    return (req, res, next)=>{
        if (typeof req[field][key] === 'undefined') {
            return res.redirect("/");
        }
        return next();
    };
}

router.get("/", function(req, res, next) {
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
                throw "Bad id.";
            }    
        } catch(e) {
            return res.redirect('/');
        }
        req.sid = id;
        return next();
    }
}

router.get("/watch",
    ensureParam("v"),
    extractVid("v"),
    function(req, res, next) {
        let song = null;
        try {
            song = songs.getSongById(req.sid);
        } catch(e) {
            return res.redirect("/");
        }
        const renderPage = ()=>{
            return res.render('watch', {
                user: req.user,
                song: song,
                recommend: songs.getRecommend(req.sid, 11.97777, 8.333333333333333e-9, -2, -3, 20)
            });
        }
        if (req.user) {
            histories.save(req.user.id, req.sid, (lastID, msg)=>{
                if (lastID === false) throw msg;
                renderPage();
            });
        } else {
            renderPage();
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
