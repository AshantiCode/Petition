const spicedPg = require('spiced-pg');
const { dbUser, dbPass } = require('./secrets');
const db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/petition`);

module.exports.registerUser = (first, last, email, hashedPass) => {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id, first, last`,
        [first, last, email, hashedPass]
    );
};
//FIXME:
module.exports.getUserByEmail = email => {
    return db.query(` SELECT * FROM users WHERE email = $1`, [email]);
};

module.exports.addSignature = (sig, user_id) => {
    return db.query(
        `INSERT INTO signatures  sig, user_id) VALUES ($1, $2) RETURNING id`,
        [sig, user_id]
    );
};

// USER ALREADY SIGNED
module.exports.alreadySigned = id => {
    return db.query(`
        SELECT id FROM signatures WHERE user_id = ${id}
    `);
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
