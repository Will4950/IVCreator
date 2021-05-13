const express = require('express');
const session = require('express-session');
const expressWinston = require('express-winston');
const config = require('src/config');
const logger = require('src/logger');
const auth = require('src/auth');

const app = express();
app.set('port', config.port);
app.set('views', 'views');
app.set('view engine', 'pug');
app.use(express.static('public'));
app.use(express.static('js'));
app.use(express.static('stylesheets'));
app.use(express.static('node_modules/bootstrap/dist/js'));
app.use('/fonts', express.static('node_modules/bootstrap-icons/font/fonts'));
app.use(express.static('node_modules/@popperjs/core/dist/umd'));
app.use(express.static('node_modules/jquery/dist'));
app.use(expressWinston.logger({winstonInstance: logger}));

app.use(session({
  cookie: { httpOnly: true },
    secret: config.secret,
    resave: true,
    saveUninitialized: false
}));

app.use(auth.oidc.router);

app.get('/', (req, res) => {
  auth.authroute(req, res, 'index');
});

app.get('/jobs', auth.oidc.ensureAuthenticated(), (req, res) => {
  auth.authroute(req, res, 'jobs');
});

app.get('/4Slide', auth.oidc.ensureAuthenticated(), (req, res) => {
  auth.authroute(req, res, '4Slide');
});

app.get('/logout', (req, res,) => {
  req.logout();
  res.redirect('/');
});

module.exports = app;