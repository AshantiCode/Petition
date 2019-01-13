const express = require('express'),
    app = express(),
    ca = require('chalk-animation'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    db = require('./db'),
    log = console.log;

//tell express which template to use (handlebars)
var hb = require('express-handlebars');
app.engine('handlebars', hb());
app.set('view engine', 'handlebars');

// Middleware
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('./public'));

// Routes Handler
app.get('/', (req, res) => {
    if (req.cookies.signed) {
        res.redirect('/signers');
    } else {
        res.render('home', {
            pageTitle: 'Homepage',
            layout: 'main'
        });
    }
});

app.get('/home', (req, res) => {
    if (req.cookies.signed) {
        res.redirect('/signers');
    } else {
        res.render('home', {
            pageTitle: 'Homepage',
            layout: 'main'
        });
    }
});

app.post('/home', (req, res) => {
    db.addSignature(req.body.userFirstName, req.body.userLastName, req.body.sig)
        .then(() => {
            res.redirect('/thankyou');
        })
        .catch(function(err) {
            res.render('home', {
                error: true,
                layout: 'main'
            });
        });
});

app.get('/thankyou', (req, res) => {
    res.render('thankyou', {
        pageTitle: 'Thank You!',
        layout: 'main'
    });
});

//TODO###################:
// app.get('/cookies', function(req, res) {
//     // Cookies that have not been signed
//     console.log('Cookies: ', req.cookies);
//     // Cookies that have been signed
//     console.log('Signed Cookies: ', req.signedCookies);
// });
// //TODO###################:
// app.get('/signers', function(req, res) {
//     db.getSigners().then(function(signers) {
//         console.log('signers.rows: ', signers.rows);
//         res.render('signers', {
//             signers: signers.rows,
//             layout: 'main'
//         });
//     });
// });

// Server
app.listen(3000, () => ca.rainbow('Yo, I am listening on 3000!'));
