const express = require('express');
const session = require('express-session');
const { Issuer } = require('openid-client');

const app = express();
const port = 3000;

app.use(session({
  secret: 'your-session-secret',
  resave: false,
  saveUninitialized: true
}));

let client;

(async () => {
  const issuer = await Issuer.discover('https://oauth.id.jumpcloud.com'); // JumpCloud Issuer
  client = new issuer.Client({
    client_id: 'aa214487-fdfb-491d-80ae-6bbbe4e8415a',
    client_secret: 'yooCUc~He5pIc456ObVlrc-luj',
    redirect_uris: ['http://localhost:3000/callback'],
    response_types: ['code']
  });

  app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
  });
})();

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  const url = client.authorizationUrl({
    scope: 'openid profile email'
  });
  res.redirect(url);
});

app.get('/callback', async (req, res) => {
  const params = client.callbackParams(req);
  const tokenSet = await client.callback('http://localhost:3000/callback', params);
  req.session.userinfo = await client.userinfo(tokenSet.access_token);
  res.redirect('/profile');
});

app.get('/profile', (req, res) => {
  if (!req.session.userinfo) return res.redirect('/login');
  res.json(req.session.userinfo);
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.send('Logged out. <a href="/login">Login again</a>');
  });
});
