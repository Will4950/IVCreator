const fs = require("fs");
const path = require('path');
const express = require('express');
const session = require('express-session');
const expressWinston = require('express-winston');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage()});
const config = require('src/config');
const logger = require('src/logger');
const {oidc, authmw} = require('src/auth');
const {dbmw} = require('src/db');
const {uploadText, uploadImage, createJob} = require('src/client');
const fsmw = require('src/fs');

const sessionmw = session({
  cookie: { httpOnly: true },
    secret: config.secret,
    resave: true,
    saveUninitialized: false,
});

const reqrender = (template, res, req) => {
  res.render(template, {auth: req.auth, sub: req.sub, download: req.download, docs: req.docs, qjobs: req.qjobs, job: req.job});
}

const app = express();
app.set('port', config.port);
app.set('view engine', 'pug');
app.set('views', 'views');
app.use(express.json({limit:'100MB'}));
app.use(express.urlencoded({extended: false, limit:'100MB'}));
app.use(express.static('public/assets'));
app.use(express.static('public/js'));
app.use(express.static('public/stylesheets'));
app.use(express.static('node_modules/bootstrap/dist/js'));
app.use(express.static('node_modules/@popperjs/core/dist/umd'));
app.use(express.static('node_modules/jquery/dist'));
app.use('/webfonts', express.static('node_modules/@fortawesome/fontawesome-free/webfonts'));
app.use('/download', express.static('public/download'));
app.use(expressWinston.logger({winstonInstance: logger}));
app.use(sessionmw);
app.use(oidc.router);
app.use(authmw);
app.use(dbmw);
app.use(fsmw);

app.get('/', (req, res) => {
  res.render('index', {auth: req.auth}); 
});

app.get('/jobs', oidc.ensureAuthenticated(), (req, res) => {  
  reqrender('jobs', res, req);
});

app.get('/help', oidc.ensureAuthenticated(), (req, res) => {  
  reqrender('help', res, req);
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

var normalizedPath = path.join(__dirname, "../views/templates");
fs.readdirSync(normalizedPath).forEach(function(file) {
  app.get('/' + file, oidc.ensureAuthenticated(), (req, res) => {
    reqrender('templates/' + file + '/' + file, res, req);
  });
});

app.get('/status', oidc.ensureAuthenticated(), (req, res) => { 
  try{
    var page = req.query.page;
    switch (page){
      case 'jobs':
        reqrender('mixins/' + page + '-card.pug', res, req);
        break;
      default:
        reqrender('templates/' + page + '/' + page + '-job.pug', res, req);
    }    
  } 
  catch(e){logger.error(e);}  
});

app.post('/upload-text', oidc.ensureAuthenticated(), upload.none(), uploadText);
app.post('/upload-image', oidc.ensureAuthenticated(), upload.single('file'), uploadImage);
app.post('/create-job', oidc.ensureAuthenticated(), upload.none(), createJob);

app.use(function(req, res) {
  res.status(404).render('404');
});

app.use(function(error, req, res, next) {
  res.status(500).render('500');
});

module.exports = app;