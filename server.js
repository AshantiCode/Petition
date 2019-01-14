const express = require('express'),
    app = express(),
    ca = require('chalk-animation'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    db = require('./db'),
    cookieSession = require('cookie-session'),
    log = console.log;
let userID;

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
    if (userID) {
        res.redirect('/signers');
    } else {
        res.render('home', {
            pageTitle: 'Homepage',
            layout: 'main'
        });
    }
});

app.get('/home', (req, res) => {
    if (userID) {
        res.redirect('/signers');
    } else {
        res.render('home', {
            pageTitle: 'Homepage',
            layout: 'main'
        });
    }
});

app.post('/home', (req, res) => {
    const firstName = req.body.first;
    const lastName = req.body.last;
    const signature = req.body.sig;

    db.addSignature(firstName, lastName, signature)
        .then(data => {
            console.log('Signer has been saved to DB');
            console.log('Signer ID: ', data);
            req.session = {
                id: data.rows[0].id,
                name: `${data.rows[0].first} ${data.rows[0].last}`
            };
            userID = req.session.id;
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
    // console.log('UserID:', userID);
    console.log('req.session:', req.session);
    // console.log('res.session.id:', req.session.id);
    if (userID) {
        db.getSignature(userID).then(data => {
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

app.post('/signers', (req, res) => {
    req.session = null;
    res.redirect('/');
});

// Server
app.listen(3000, () => ca.rainbow('Yo, I am listening on 3000!'));
