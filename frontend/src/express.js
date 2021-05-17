const express = require('express');
const session = require('express-session');
const expressWinston = require('express-winston');
const config = require('src/config');
const logger = require('src/logger');
const {oidc, authmw} = require('src/auth');
const {dbmw} = require('src/db');
const fsmw = require('src/fs');
const {socketmw} = require('src/io');

const app = express();
app.set('port', config.port);
app.set('view engine', 'pug');
app.set('views', 'views');
app.use(express.static('assets'));
app.use('/download', express.static('public'));
app.use(express.static('js'));
app.use(express.static('stylesheets'));
app.use(express.static('node_modules/bootstrap/dist/js'));
app.use(express.static('node_modules/@popperjs/core/dist/umd'));
app.use(express.static('node_modules/jquery/dist'));
app.use('/webfonts', express.static('node_modules/@fortawesome/fontawesome-free/webfonts'));
app.use(expressWinston.logger({winstonInstance: logger}));

const sessionmw = session({
  cookie: { httpOnly: true },
    secret: config.secret,
    resave: true,
    saveUninitialized: false,
});

app.use(sessionmw);
app.use(oidc.router);
app.use(authmw);
app.use(dbmw);
app.use(fsmw);
app.use(socketmw);

const reqrender = (template, res, req) => {
  res.render(template, {auth: req.auth, sub: req.sub, download: req.download, docs: req.docs, qjobs: req.qjobs, job: req.job});
}

app.get('/', (req, res) => {
  res.render('index', {auth: req.auth}); 
});

app.get('/jobs', oidc.ensureAuthenticated(), (req, res) => {  
  reqrender('jobs', res, req);
});

app.get('/4Slide', oidc.ensureAuthenticated(), (req, res) => {
  reqrender('4Slide', res, req);
});

app.get('/Welcome', oidc.ensureAuthenticated(), (req, res) => {
  reqrender('Welcome', res, req);
});

app.get('/logout', (req, res,) => {
  req.logout();
  res.redirect('/');
});

app.get('/api/jobs', oidc.ensureAuthenticated(), (req, res) => {
  res.render('mixins/jobs-card.pug', {sub: req.sub, download: req.download, qjobs: req.qjobs, job: req.job})  
});

app.get('/api/status', oidc.ensureAuthenticated(), (req, res) => {
  res.render('mixins/4Slide-job.pug', {job: req.job, sub: req.sub})  
});

module.exports = app;
