const spicedPg = require('spiced-pg');
const { dbUser, dbPass } = require('./secrets');
const db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/petition`);

//ADD new user to DB
module.exports.registerUser = (first, last, email, hashedPass) => {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id, first, last`,
        [first, last, email, hashedPass]
    );
};

// GET USER
module.exports.getUserByEmail = email => {
    return db.query(` SELECT * FROM users WHERE email = $1`, [email]);
};

// ADD Signsture to DB
module.exports.addSignature = (sig, user_id) => {
    return db.query(
        `INSERT INTO signatures (sig, user_id) VALUES ($1, $2) RETURNING id`,
        [sig, user_id]
    );
};

// USER ALREADY SIGNED
module.exports.alreadySigned = id => {
    return db.query(
        `
        SELECT id FROM signatures WHERE user_id = $1`,
        [id]
    );
};

//Get Signers
module.exports.getSigners = () => {
    return db.query(
        `SELECT 
        users.first AS first, users.last AS last, user_profiles.age AS age, user_profiles.city as city, user_profiles.url AS url FROM signatures 
        LEFT JOIN users 
        ON signatures.user_id = users.id
        LEFT JOIN user_profiles
        ON signatures.user_id = user_profiles.user_id`
    );
};

// GET Signature
module.exports.getSignature = function(id) {
    return db.query(
        `SELECT sig
        FROM signatures
        WHERE id = $1`,
        [id]
    );
};

// INSERT profile data to DB
module.exports.addProfile = (age, city, url, userId) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4)`,
        [age, city, url, userId]
    );
};
