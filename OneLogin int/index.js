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
  const issuer = await Issuer.discover('https://bhuvan.onelogin.com/oidc/2');
  client = new issuer.Client({
    client_id: '',
    client_secret: 'f98c80de332801d6805e7bfd2fc4a69905385a887282eefa9603fb59594f',
    redirect_uris: ['http://localhost:3000/callback'],
    response_types: ['code']
  });

  app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
  });
})();
app.get('/', (req, res) => {
  res.send(`
    <h1>Welcome</h1>
    <p><a href="/login">Login with OneLogin</a></p>
  `);
});

app.get('/login', (req, res) => {
  const url = client.authorizationUrl({ scope: 'openid profile email' });
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
