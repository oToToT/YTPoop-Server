const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('testdb.sqlite3');

db.serialize(function(){
    db.run(`
       CREATE TABLE IF NOT EXISTS "history" (
           "id" INTEGER PRIMARY KEY AUTOINCREMENT,
           "uid" INTEGER, -- id of the user
           "sid" INTEGER, -- id of the song,
           "timestamp" INTEGER -- timestamp of this record
       )`
    );
});

function save(uid, sid, cb) {
    db.run('INSERT INTO history (uid, sid, timestamp) VALUES (?, ?, ?)',
        uid, sid, Date.now(),
        function(err) {
            if (err) return cb(false, err);
            return cb(this.lastID)
        }
    );
}

function get(uid, cb) {
    db.all('SELECT sid, timestamp FROM history WHERE uid = ?', uid, function(err, rows) {
        if (err) return cb(false, err)
        return cb(rows);
    });
}

module.exports = {
    save: save,
    get: get
}
