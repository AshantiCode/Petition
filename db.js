const spicedPg = require('spiced-pg');
const { dbUser, dbPass } = require('./secrets');
const db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/petition`);

module.exports.addSignature = (first, last, sig) => {
    return db.query(
        `INSERT INTO signatures (first,last, sig) VALUES ($1, $2, $3) RETURNING id,first, last`,
        [first, last, sig]
    );
};

module.exports.getSigners = () => {
    return db.query(`SELECT id,first, last  FROM signatures`);
};

module.exports.getSignature = function(id) {
    return db.query(
        `SELECT sig
        FROM signatures
        WHERE id = $1`,
        [id]
    );
};

// removed sig line 14
