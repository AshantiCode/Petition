let { genSalt, hash, compare } = require('bcryptjs');
const { promisify } = require('util');

genSalt = promisify(genSalt);
hash = promisify(hash);
compare = promisify(compare);

module.exports.hash = password => {
    return genSalt().then(salt => {
        return hash(password, salt);
    });
};

module.exports.comparePassword = (password, hashedPass) => {
    return new Promise((resolve, reject) => {
        compare(password, hashedPass, (err, doesMatch) => {
            if (err) {
                reject(err.message);
            } else {
                resolve(doesMatch);
            }
        });
    });
};
