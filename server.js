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
    res.render('registration2', {
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
    // console.log('req.Body of Profile: ', req.body);
    let url = req.body.url;
    if (
        !url.startsWith('http://') &&
        !url.startsWith('https://') &&
        !url.startsWith('//')
    ) {
        url = 'http://' + url;
    }
    db.addProfile(req.body.age, req.body.city, url, req.session.userId).then(
        data => {
            console.log('data aus addProfile:', data);
            res.redirect('/petition');
        }
    );
});

// ############################ TODO: ###############################
app.get('/edit', (req, res) => {
    db.getProfileInfo(req.session.userId).then(data => {
        res.render('edit', {
            layout: 'main',
            first: data.rows[0].first,
            last: data.rows[0].last,
            email: data.rows[0].email,
            age: data.rows[0].age || null,
            city: data.rows[0].city || null,
            url: data.rows[0].url || null
        });
    });
});

app.post('/edit', (req, res) => {
    if (req.body.password) {
        bcrypt.hash(req.body.password).then(hashedPassword => {
            Promise.all([
                db.updateUsersWithPassword(
                    req.body.first,
                    req.body.last,
                    req.body.email,
                    hashedPassword,
                    req.session.userId
                ),
                db.updateUserProfiles(
                    req.body.age,
                    req.body.city,
                    req.body.url,
                    req.session.userId
                )
            ])
                .then(() => {
                    (req.session.first = req.body.first),
                    (req.session.last = req.body.last);
                    res.redirect('/edit-confirmation');
                })
                .catch(err => {
                    console.log('Error in Edit Page: ', err);
                });
        });
    } else {
        Promise.all([
            db.updateUsersWithoutPassword(
                req.body.first,
                req.body.last,
                req.body.email,
                req.session.userId
            ),
            db.updateUserProfiles(
                req.body.age,
                req.body.city,
                req.body.url,
                req.session.userId
            )
        ])
            .then(() => {
                req.session.first = req.body.first;
                req.session.last = req.body.last;
                res.redirect('/edit-confirmation');
            })
            .catch(err => {
                console.log('Error in else PArt edit page: ', err);
            });
    }
});

app.get('/edit-confirmation', (req, res) => {
    console.log('Get request to edit confirmtation');
    res.render('edit-confirmation', {
        layout: 'main'
    });
});

// ############################# TODO: ####################################

app.get('/login', (req, res) => {
    res.render('login', {
        layout: 'main'
    });
});

app.post('/login', (req, res) => {
    console.log('req.body: ', req.body);
    // let userId = '';
    // let first = '';
    // let last = '';

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
        Promise.all([db.getSignature(req.session.sigId), db.getSigners()])
            .then(data => {
                console.log('data von getsig und getSigners: ', data);
                res.render('thankyou', {
                    pageTitle: 'Thank You!',
                    layout: 'main',
                    signatureImg: data[0].rows[0].sig,
                    firstName: req.session.first,
                    numOfSigners: data[1].rows.length
                });
            })
            .catch(err => {
                console.log('Error in app.get ThankYou: ', err);
            });
    } else {
        res.redirect('/petition');
    }
});

app.post('/thankyou', (req, res) => {
    db.deleteSignature(req.session.sigId)
        .then(() => {
            req.session.sigId = null;
        })
        .then(() => {
            res.redirect('/petition');
        })
        .catch(err => {
            console.log('Error in deleteSignature:', err);
        });
});

app.get('/signers', (req, res) => {
    db.getSigners()
        .then(data => {
            // console.log('signers data rows: ', data.rows);
            res.render('signers', {
                numOfSigners: data.rows.length - 1,
                signers: data.rows,
                layout: 'main'
            });
        })
        .catch(err => console.log('Error in signers:', err));
});

app.get('/signers/:city', (req, res) => {
    db.getSignersbyCity(req.params.city)
        .then(data => {
            console.log('signers data rows2: ', data.rows);
            res.render('signers', {
                numOfSigners: data.rows.length - 1,
                signers: data.rows,
                city: req.param.city,
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
app.listen(process.env.PORT || 8080, () =>
    ca.rainbow('Yo, I am listening on 8080!')
);
