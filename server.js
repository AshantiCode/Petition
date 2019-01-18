const express = require('express');
const app = express();
const ca = require('chalk-animation');
const fs = require('fs');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const db = require('./db');
const cookieSession = require('cookie-session');
const bcrypt = require('./bcrypt');
const csurf = require('csurf');
const log = console.log;

//tell express which template to use (handlebars)
var hb = require('express-handlebars');
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

// Middleware  #########################################################
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

app.use(express.static('./public'));

// user that are logged out try to type other url then registration or login are redirected to registration
app.use(function(req, res, next) {
    if (
        !req.session.userId &&
        req.url != '/registration' &&
        req.url != '/login'
    ) {
        res.redirect('/registration');
    } else {
        next();
    }
});
app.use(csurf());

app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    res.setHeader('X-Frame-Options', 'DENY');
    next();
});

// Routes Handler ###########################################################

app.get('/', (req, res) => {
    res.redirect('/registration');
});

app.get('/registration', (req, res) => {
    res.render('registration', {
        pageTitle: 'Registration',
        layout: 'main'
    });
});

app.post('/registration', (req, res) => {
    if (
        !req.body.first ||
        !req.body.last ||
        !req.body.email ||
        !req.body.password
    ) {
        res.render('registration', {
            layout: 'main',
            error: true
        });
    } else {
        bcrypt
            .hash(req.body.password)
            .then(hashedPass => {
                return db.registerUser(
                    req.body.first,
                    req.body.last,
                    req.body.email,
                    hashedPass
                );
            })
            .then(data => {
                console.log('User added to database users');
                (req.session.userId = data.rows[0].id),
                (req.session.first = data.rows[0].first),
                (req.session.last = data.rows[0].last),
                console.log('Cookies have been set!');
                res.redirect('/profile');
            })
            .catch(err => {
                console.log(err);
                res.render('registration', {
                    error: true,
                    layout: 'main'
                });
            });
    }
});

app.get('/profile', (req, res) => {
    res.render('profile', {
        layout: 'main',
        pageTitle: 'Profile',
        firstName: req.session.first
    });
});

app.post('/profile', (req, res) => {
    console.log('req.Body of Profile: ', req.body);
    db.addProfile(
        req.body.age,
        req.body.city,
        req.body.url,
        req.session.userId
    ).then(data => {
        console.log('data aus addProfile:', data);
        res.redirect('/petition');
    });
});

app.get('/login', (req, res) => {
    res.render('login', {
        layout: 'main'
    });
});

app.post('/login', (req, res) => {
    console.log('req.body: ', req.body);
    let userId = '';
    let first = '';
    let last = '';

    db.getUserByEmail(req.body.email).then(data => {
        req.session.userId = data.rows[0].id;
        req.session.first = data.rows[0].first;
        req.session.last = data.rows[0].last;
        return bcrypt
            .comparePassword(req.body.password, data.rows[0].password)
            .then(
                bool => {
                    if (bool) {
                        db.alreadySigned(req.session.userId).then(data => {
                            console.log('Data from alreadySigned: ', data);
                            if (data.rows.length >= 1) {
                                req.session.sigId = data.rows[0].id;

                                res.redirect('/thankyou');
                            } else {
                                res.redirect('/petition');
                            }
                        }); //closes alreadySigned
                    } else {
                        req.session = null;
                        res.render('/login', {
                            layout: 'main',
                            error: true
                        });
                    }
                } // closes bool
            )
            .catch(err => {
                console.log('Error in GetUserbyEmail:', err);
            });
    }); //closes getUserByEMail
});

app.get('/petition', (req, res) => {
    log('req.session in petition Get:', req.session);
    if (req.session.sigId) {
        res.redirect('/thankyou');
    } else {
        res.render('petition', {
            pageTitle: 'Homepage',
            layout: 'main'
        });
    }
});

app.post('/petition', (req, res) => {
    log('req.session in Petition POST:', req.session);
    const firstName = req.session.first;
    const lastName = req.session.last;
    const signature = req.body.sig;
    const userId = req.session.userId;
    db.addSignature(req.body.sig, req.session.userId)
        .then(data => {
            console.log('added signature to DB signature');
            req.session.sigId = data.rows[0].id;
            console.log('Signature in Cookie!');
            res.redirect('/thankyou');
        })
        .catch(function(err) {
            console.log('Error in addSign:', err);
            res.render('petition', {
                error: true,
                layout: 'main'
            });
        });
});

app.get('/thankyou', (req, res) => {
    console.log('req.sessionin Thank Your:', req.session);
    // console.log('res.session.id:', req.session.id);
    if (req.session.sigId) {
        db.getSignature(req.session.sigId).then(data => {
            console.log('Data: ', data);
            res.render('thankyou', {
                pageTitle: 'Thank You!',
                layout: 'main',
                signatureImg: data.rows[0].sig,
                firstName: req.session.first
            });
        });
    } else {
        res.redirect('/petition');
    }
});

app.get('/signers', (req, res) => {
    db.getSigners()
        .then(data => {
            console.log('signers data rows: ', data.rows);
            console.log('signers.rows.length: ', data.rows.length);
            res.render('signers', {
                numOfSigners: data.rows.length - 1,
                signers: data.rows,
                layout: 'main'
            });
        })
        .catch(err => console.log('Error in signers:', err));
});

app.get('/logout', (req, res) => {
    req.session = null;
    res.render('logout', {
        layout: 'main'
    });
});

// Server
app.listen(process.env.PORT || 8080, () => ca.rainbow('Yo, I am listening on 8080!'));
