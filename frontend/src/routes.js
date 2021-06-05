const fs = require("fs");
const path = require('path');
const express = require('express');
const router = express.Router();
const {oidc} = require('src/auth');
const logger = require('src/logger');

const reqrender = (template, req, res) => {
    res.render(template, {auth: req.auth, sub: req.sub, download: req.download, docs: req.docs, qjobs: req.qjobs, job: req.job});
}

router.get('/', (req, res) => {
    res.render('index', {auth: req.auth}); 
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

router.get('/help', oidc.ensureAuthenticated(), (req, res) => {  
    reqrender('help', req, res);
});

router.get('/jobs', oidc.ensureAuthenticated(), (req, res) => {  
    reqrender('jobs', req, res);
});

var normalizedPath = path.join(__dirname, "../views/templates");
fs.readdirSync(normalizedPath).forEach(function(file) {
    router.get('/' + file, oidc.ensureAuthenticated(), (req, res) => {
        reqrender('templates/' + file + '/' + file, req, res);
    });
});

router.get('/status', oidc.ensureAuthenticated(), (req, res) => { 
    try{
        var page = req.query.page;
        switch (page){
        case 'jobs':
            reqrender('mixins/' + page + '-card.pug', req, res);
            break;
        default:
            reqrender('templates/' + page + '/' + page + '-job.pug', req, res);
        }    
    } 
    catch(e){logger.error(e);}  
});

router.use(function(req, res) {
    res.status(404).render('404', {auth: req.auth});
});

router.use(function(error, req, res, next) {
    res.status(500).render('500', {auth: req.auth});
});

module.exports = router;