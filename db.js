let spicedPg = require('spiced-pg');

let db;
// if(true) then website shoult talk to herokus postgres database
if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    //else if we are on 8080
    const { dbUser, dbPass } = require('./secrets');
    db = spicedPg(`postgres:${dbUser}:${dbPass}@localhost:5432/petition`);
}

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

// ADD Signature to DB
module.exports.addSignature = (sig, user_id) => {
    return db.query(
        `INSERT INTO signatures (sig, user_id) VALUES ($1, $2) RETURNING id`,
        [sig, user_id]
    );
};

module.exports.deleteSignature = sigId => {
    return db.query(`DELETE FROM signatures WHERE id = $1`, [sigId]);
};

// Update Users-Table
module.exports.updateUsersWithPassword = (
    first,
    last,
    email,
    hashedPassword,
    userId
) => {
    db.query(
        `UPDATE users
    SET first = $1, last = $2, email = $3, password = $4
    WHERE id = $5 `,
        [first, last, email, hashedPassword, userId]
    );
};

module.exports.updateUsersWithoutPassword = (first, last, email, userId) => {
    db.query(
        `UPDATE users
        SET first = $1, last = $2, email = $3 WHERE id = $4`,
        [first, last, email, userId]
    );
};
// Fill the Edit Profile Inputfields with User-data
module.exports.getProfileInfo = function(id) {
    return db.query(
        `SELECT users.first, users.last, users.email, user_profiles.age, user_profiles.city, user_profiles.url
        FROM users
        LEFT JOIN user_profiles 
        ON users.id = user_profiles.user_id
        WHERE users.id = $1`,
        [id]
    );
};

// Update User_Profiles- Table
module.exports.updateUserProfiles = (age, city, url, user_id) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id)
    DO UPDATE SET age = $1,city = $2, url = $3
     `,
        [age ? Number(age) : null || null, city || null, url || null, user_id]
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

module.exports.getSignersbyCity = city => {
    return db.query(
        `SELECT 
        users.first AS first, users.last AS last, user_profiles.age AS age, user_profiles.city as city, user_profiles.url AS url FROM signatures 
        LEFT JOIN users 
        ON signatures.user_id = users.id
        LEFT JOIN user_profiles
        ON signatures.user_id = user_profiles.user_id WHERE LOWER(city)  = LOWER($1)`,
        [city]
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
