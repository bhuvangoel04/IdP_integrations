const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const SamlStrategy = require('passport-saml').Strategy;
const fs = require('fs');

const app = express();
const PORT = 3000;

// Replace these with values from your miniOrange admin portal
const samlStrategy = new SamlStrategy(
  {
    entryPoint: 'https://bhuvan.xecurify.com/moas/idp/samlsso/ef5f2a0e-e9da-4668-9257-8da8049e7faa', // from miniOrange
    issuer: 'urn:my-local-sp', // your SP Entity ID
    callbackUrl: 'http://localhost:3000/saml/acs', // must match what you entered in miniOrange
    cert: fs.readFileSync('./certs/miniorange-x509.pem', 'utf-8'),
    identifierFormat: null,
    acceptedClockSkewMs: 50000000000000000,
  },
  (profile, done) => {
    return done(null, profile);
  }
);

passport.use(samlStrategy);
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(session({ secret: 'mysecret', resave: false, saveUninitialized: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

// Home page
app.get('/', (req, res) => {
  res.send(req.isAuthenticated()
    ? `<h2>Welcome, ${req.user.nameID}!</h2><a href="/logout">Logout</a>`
    : `<h2>Welcome!</h2><a href="/login">Login with SAML</a>`);
});

// SAML login route
app.get('/login', passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }), (req, res) => {
  res.redirect('/');
});

// SAML callback route (ACS URL)
app.post('/saml/acs', passport.authenticate('saml', { failureRedirect: '/', failureFlash: true }), (req, res) => {
  res.redirect('/');
});

// Logout route
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`SAML app running on http://localhost:${PORT}`);
});
