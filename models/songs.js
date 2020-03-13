const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });
import songs from '../models/songs.json';
import Heapify from 'heapify';

/* initialize indices once started */
let INDICES = new Uint32Array(songs.length);
for (let i = 0; i < songs.length; i++) {
    INDICES[i] = i;
}

async function searchAll(query, limits=30, from=0) {
    const result = await client.search({
        index: 'songs',
        body: {
            from: from,
            size: limits,
            query: {
                multi_match : {
                    query: query,
                    fields: [ "name^6", "singer^6", "lyrics^2", "date^8" ],
                }
            }
        }
    });
    return result.body.hits.hits;
}
async function searchByName(query, limits=30, from=0) {
    const result = await client.search({
        index: 'songs',
        body: {
            from: from,
            size: limits,
            query: {
                multi_match : {
                    query: query,
                    fields: [ "name^2", "*" ],
                }
            }
        }
    });
    return result.body.hits.hits;
}
async function searchBySinger(query, limits=30, from=0) {
    const result = await client.search({
        index: 'songs',
        body: {
            from: from,
            size: limits,
            query: {
                multi_match : {
                    query: query,
                    fields: [ "singer^2", "*" ],
                }
            }
        }
    });
    return result.body.hits.hits;
}
async function searchByLyrics(query, limits=30, from=0) {
    const result = await client.search({
        index: 'songs',
        body: {
            from: from,
            size: limits,
            query: {
                multi_match : {
                    query: query,
                    fields: [ "lyrics^2", "*" ],
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

function textDis(s1, s2) {
    let v1 = [], v2 = [];
    for (let i = 0; i + 1 < s1.length; ++i) {
        v1.push(s1.slice(i, i + 1));
    }
    for (let i = 0; i + 2 < s1.length; ++i) {
        v1.push(s1.slice(i, i + 2));
    }
    for (let i = 0; i + 1 < s2.length; ++i) {
        v2.push(s2.slice(i, i + 1));
    }
    for (let i = 0; i + 2 < s2.length; ++i) {
        v2.push(s2.slice(i, i + 2));
    }
    let union = [], inter = [];
    for (let v of v1) {
        if (!union.includes(v)) {
            union.push(v);
        }
    }
    for (let v of v2) {
        if (!union.includes(v)) {
            union.push(v);
        }
    }
    for (let v of v1) {
        if (!inter.includes(v) && v2.includes(v)) {
            inter.push(v);
        }
    }
    return inter.length / union.length;
}

function pairWeight(s1, s2) {
    const dv = vecdis(s1.vecvalue, s2.vecvalue)
    const d1 = new Date(s1.date);
    const d2 = new Date(s2.date);
    const dt = Math.abs(d1 - d2);
    const ds = Number(s1.singer == s2.singer);
    const dn = textDis(s1.name, s2.name);
    return [dv, dt, ds, dn];
};

function getRecommend(id, a, b, c, d, K = 20) {
    const calcWeight = (dv, dt, ds, dn)=>{
        return Math.exp(dv * a) + Math.exp(b*dt) + c*ds + d*dn;
    };

    let bestV = [], bestT = [], bestS = [], bestN = [];
    let weights = new Float64Array(songs.length);
    for (let i = 0 ; i < songs.length; i++) {
        const [dv, dt, ds, dn] = pairWeight(songs[id], songs[i]);
        weights[i] = calcWeight(dv, dt, ds, dn);
        if (i == id) continue;
        
        let updV = false;
        if (!updV) updV = (bestV.length == 0);
        if (!updV) updV = (dv < bestV[0]);
        if (!updV) updV = (dv == bestV[0] && weights[i] < weights[bestV[1]]);
        if (updV) bestV = [dv, i];

        let updT = false;
        if (!updT) updT = (bestT.length == 0);
        if (!updT) updT = (dt < bestT[0]);
        if (!updT) updT = (dt == bestT[0] && weights[i] < weights[bestT[1]]);
        if (updT) bestT = [dt, i];

        let updS = false;
        if (!updS) updS = (bestS.length == 0);
        if (!updS) updS = (ds > bestS[0]);
        if (!updS) updS = (ds == bestS[0] && weights[i] < weights[bestS[1]]);
        if (updS) bestS = [ds, i];

        let updN = false;
        if (!updN) updN = (bestN.length == 0);
        if (!updN) updN = (dn > bestN[0]);
        if (!updN) updN = (dn == bestN[0] && weights[i] < weights[bestN[1]]);
        if (updN) bestN = [dn, i];

    }


    let rec = [];
    const addToRec = (i) => {
        let s = Object.assign({}, songs[i]);
        delete s.vecvalue;
        s.id = i;
        /* might not need information below */
        s.weight = weights[i];
        s.a = vecdis(songs[i].vecvalue, songs[id].vecvalue);
        s.b = Math.abs((new Date(songs[i].date)) - (new Date(songs[id].date)));
        s.c = Number(songs[i].singer == songs[id].singer);
        s.d = textDis(songs[i].name, songs[id].name);
        rec.push(s);
    }

    let already = [];
    if (Math.random() > 0.7 && rec.length < K &&
        !already.includes(bestV[1])) {
        addToRec(bestV[1]);
        already.push(bestV[1]);
    }
    if (Math.random() > 0.8 && rec.length < K &&
        !already.includes(bestT[1])) {
        addToRec(bestT[1]);
        already.push(bestT[1]);
    }
    if (Math.random() > 0.7 && rec.length < K &&
        !already.includes(bestS[1])) {
        addToRec(bestS[1]);
        already.push(bestS[1]);
    }
    if (Math.random() > 0.7 && rec.length < K &&
        !already.includes(bestN[1])) {
        addToRec(bestN[1]);
        already.push(bestN[1]);
    }

    let heap = new Heapify(songs.length, INDICES, weights, Uint32Array, Float64Array);
    while (rec.length < K) {
        let i = heap.pop();
        if (i == id || already.includes(i)) continue;
        addToRec(i);
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
    searchAll: searchAll,
    searchByName: searchByName,
    searchBySinger: searchBySinger,
    searchByLyrics: searchByLyrics,
    getRecommend: getRecommend,
    getSongById: getSongById,
    randomSample: randomSample,
    pairWeight: pairWeight
};
