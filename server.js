const express = require('express'),
    app = express(),
    ca = require('chalk-animation'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    db = require('./db'),
    cookieSession = require('cookie-session'),
    bcrypt = require('./bcrypt');
log = console.log;

//tell express which template to use (handlebars)
var hb = require('express-handlebars');
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

// Middleware
app.use(cookieParser());
app.use(
    cookieSession({
        secret: `I'm always angry.`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public'));

// Routes Handler
app.get('/', (req, res) => {
    if (req.session.sigId) {
        res.redirect('/thankyou');
    } else {
        res.render('home', {
            pageTitle: 'Homepage',
            layout: 'main'
        });
    }
});

app.get('/home', (req, res) => {
    if (req.session.sigId) {
        res.redirect('/thankyou');
    } else {
        res.render('home', {
            pageTitle: 'Homepage',
            layout: 'main'
        });
    }
});

app.post('/home', (req, res) => {
    const firstName = req.session.first;
    const lastName = req.session.last;
    const signature = req.body.sig;
    const userId = req.session.userId;
    db.addSignature(firstName, lastName, signature, userId)
        .then(data => {
            console.log('Signer has been saved to DB');
            req.session.sigId = data.rows[0].id;

            console.log('req.session name: ', req.session.name);
            res.redirect('/thankyou');
        })
        .catch(function(err) {
            console.log('Error in addSign:', err);
            res.render('home', {
                error: true,
                layout: 'main'
            });
        });
});

app.get('/thankyou', (req, res) => {
    console.log('req.session:', req.session);
    // console.log('res.session.id:', req.session.id);
    if (req.session.sigId) {
        db.getSignature(req.session.sigId).then(data => {
            console.log('Data: ', data);
            res.render('thankyou', {
                pageTitle: 'Thank You!',
                layout: 'main',
                signatureImg: data.rows[0].sig,
                name: req.session.name
            });
        });
    } else {
        res.redirect('/home');
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

app.get('/registration', (req, res) => {
    res.render('registration', {
        pageTitle: 'Registration',
        layout: 'main'
    });
});

//FIXME:
app.post('/registration', (req, res) => {
    console.log('req.body:', req.body);
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
            console.log('Data: ', data);
            (req.session.userId = data.rows[0].id),
            (req.session.first = data.rows[0].first),
            (req.session.last = data.rows[0].last),
            console.log('User has been registered!');
            res.redirect('/home');
        })
        .catch(err => {
            console.log(err);
            res.render(home, {
                error: true,
                layout: 'main'
            });
        });
});

// TODO: Login Routes

app.get('/login', (req, res) => {
    res.render(login), {};
});

app.post('/login', (req, res) => {
    res.render(), {};
});

// Server
app.listen(3000, () => ca.rainbow('Yo, I am listening on 3000!'));
