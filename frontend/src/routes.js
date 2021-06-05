const fs = require("fs");
const path = require('path');
const app = require('src/express');
const {oidc} = require('src/auth');
const logger = require('src/logger');

const reqrender = (template, res, req) => {
    res.render(template, {auth: req.auth, sub: req.sub, download: req.download, docs: req.docs, qjobs: req.qjobs, job: req.job});
}

app.get('/', (req, res) => {
    res.render('index', {auth: req.auth}); 
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/help', oidc.ensureAuthenticated(), (req, res) => {  
    res.render('help');
});

app.get('/jobs', oidc.ensureAuthenticated(), (req, res) => {  
    reqrender('jobs', res, req);
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

app.use(function(req, res) {
    res.status(404).render('404');
});

app.use(function(error, req, res, next) {
    res.status(500).render('500');
});
