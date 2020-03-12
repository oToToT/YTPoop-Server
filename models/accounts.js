const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('testdb.sqlite3');

db.serialize(function(){
    db.run(`
       CREATE TABLE IF NOT EXISTS "users" (
           "id" INTEGER PRIMARY KEY AUTOINCREMENT,
           "username" TEXT,
           "password" TEXT,    -- sha256 hash of the plain-text password
           "salt" TEXT,        -- salt that is appended to the password before it is hashed
           "a" REAL DEFAULT 0, -- paramater a of recommendation
           "b" REAL DEFAULT 0, -- paramater b of recommendation
           "c" REAL DEFAULT 0, -- paramater c of recommendation
           "d" REAL DEFAULT 0  -- paramater d of recommendation
       )`
    );
});

function hashPassword(password, salt) {
    let hash = crypto.createHash('sha256');
    hash.update(password);
    hash.update(salt);
    return hash.digest('hex');
}

function validate(username, password, cb) {
    db.get('SELECT salt FROM users WHERE username = ?', username, function(err, row) {
        if (!row) return cb(false, 'Incorrect username or password.');
        const hash = hashPassword(password, row.salt);
        db.get('SELECT username, id FROM users WHERE username = ? AND password = ?', username, hash, function(err, row) {
            if (!row) return cb(false, 'Incorrect username or password.');
            return cb(row);
        });
    });
}

function findUserById(id, cb) {
    db.get('SELECT id, username FROM users WHERE id = ?', id, function(err, row) {
        if (!row) return cb(false);
        return cb(row);
    });
}

function register(username, password, cb) {
    db.get('SELECT username FROM users WHERE username = ?', username, function(err, row) {
        if (row) return cb(false, 'Username already exists.');
        const salt = crypto.randomBytes(8).toString('hex');
        const hash = hashPassword(password, salt);
        db.run('INSERT INTO users (username, password, salt) VALUES (?, ?, ?)',
            username, hash, salt,
            function(err) {
               if (err) return cb(false, err);
               return cb(this.lastID);
            }
        );
    });
}

module.exports = {
    validate: validate,
    findUserById: findUserById,
    register: register
}
