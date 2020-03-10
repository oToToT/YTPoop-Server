const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });
const songs = require('../models/songs.json')
/* Should be replace with https://github.com/luciopaiva/heapify */
const { Heapify } = require('../models/heapify');

/* initialize indices once started */
let INDICES = new Uint32Array(songs.length);
for (let i = 0; i < songs.length; i++) {
    INDICES[i] = i;
}

async function search(query, limits=30, from=0) {
    const result = await client.search({
        index: 'songs',
        body: {
            from: from,
            size: limits,
            query: {
                multi_match : {
                    query: query,
                    fields: [ "name^6", "singer^10", "lyrics^2", "*" ],
                }
            }
        }
    });
    return result.body.hits.hits;
}

function vecdis(v1, v2) {
    if (v1.length !== v2.length) {
        throw "The lenth of two vectors should be the same.";
    }
    let s = 0;
    for (let i = 0; i < v1.length; ++i) {
        s += (v1[i] - v2[i]) * (v1[i] - v2[i]);
    }
    return Math.sqrt(s);
}

function lcs(s1, s2) {
    const N = s1.length, M = s2.length;
    let dp = [new Uint32Array(M + 1), new Uint32Array(M + 1)];
    let me = 0, he = 1, ans = 0;
    for (let i = 1; i <= N; ++i) {
        [me, he] = [he, me];
        dp[me].fill(0);
        for (let j = 1; j <= M; ++j) {
            if (s1[i - 1] == s2[j - 1]) {
                dp[me][j] = dp[he][j - 1] + 1;
            } else {
                dp[me][j] = Math.max(dp[he][j], dp[me][j - 1]);
            }
            ans = Math.max(ans, dp[me][j]);
        }
    }
    return ans;
}

function getRecommend(id, a, b, c, d, K = 20) {
    const calcWeight = (dv, dt, ds, dn)=>{
        return Math.exp(dv * a) + b*dt + c*ds + d*dn;
    };
    const pairWeight = (s1, s2)=>{
        const dv = vecdis(s1.vecvalue, s2.vecvalue)
        const d1 = new Date(s1.date);
        const d2 = new Date(s2.date);
        const dt = Math.abs(d1 - d2);
        const ds = Number(s1.singer == s2.singer);
        const dn = lcs(s1.name, s2.name);
        return calcWeight(dv, dt, ds, dn);
    };

    let weights = new Float64Array(songs.length);
    for (let i = 0 ; i < songs.length; i++) {
        weights[i] = pairWeight(songs[id], songs[i]);
    }

    let heap = new Heapify(songs.length, INDICES, weights, Uint32Array, Float64Array);
    let rec = [];
    while (rec.length < K) {
        let i = heap.pop();
        if (i == id) continue;
        let s = Object.assign({}, songs[i]);
        delete s.vecvalue;
        s.id = i;
        /* might not need information below */
        s.weight = weights[i];
        s.a = vecdis(songs[i].vecvalue, songs[id].vecvalue);
        s.b = Math.abs((new Date(songs[i].date)) - (new Date(songs[id].date)));
        s.c = Number(songs[i].singer == songs[id].singer);
        s.d = lcs(songs[i].name, songs[id].name);
        rec.push(s);
    }
    return rec;
}

function getSongById(id) {
    if (typeof id !== 'number') {
        throw "id should be a number.";
    }
    if (id >= songs.length) {
        throw "index out of range.";
    }
    return songs[id];
}

/* Initialize */
let SHUFFLED = new Uint32Array(songs.length);
for (let i = 0; i < songs.length; i++) {
    SHUFFLED[i] = i;
}

function randomSample(limit = 1) {
    if (limit > SHUFFLED.length) {
        throw "Too many required sample.";
    }
    let ret = [];
    for (let i = SHUFFLED.length - 1; i >= SHUFFLED.length - limit; --i) {
        let j = Math.floor(Math.random() * (i + 1));
        [SHUFFLED[i], SHUFFLED[j]] = [SHUFFLED[j], SHUFFLED[i]];
        let copied = Object.assign({}, songs[SHUFFLED[i]]);
        delete copied.vecvalue;
        copied.id = SHUFFLED[i];
        ret.push(copied);
    }
    return ret;
}

module.exports = {
    search: search,
    getRecommend: getRecommend,
    getSongById: getSongById,
    randomSample: randomSample
};
