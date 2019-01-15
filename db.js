const spicedPg = require('spiced-pg');
const { dbUser, dbPass } = require('./secrets');
const db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/petition`);

module.exports.registerUser = (first, last, email, hashedPass) => {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id, first, last`,
        [first, last, email, hashedPass]
    );
};

module.exports.addSignature = (first, last, sig, user_id) => {
    return db.query(
        `INSERT INTO signatures (first,last, sig,user_id) VALUES ($1, $2, $3, $4) RETURNING id`,
        [first, last, sig, user_id]
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
