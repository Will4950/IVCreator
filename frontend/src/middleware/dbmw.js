const logger = require('src/logger');
const db = require('src/redis');
const flatten = require('flat');
const {getJob, getJobs} = require('src/http');

const dbmw = (req, res, next) => {
    if (req.auth){
        const userinfo = req.userContext && req.userContext.userinfo;
        var sub = userinfo.sub;
        db.hset(sub, 'sub', sub);
        req.sub = sub;

        var doc = flatten(require('src/doc'));
        for (const [key,val] of Object.entries(doc)) {
            try{
                db.hget(sub, key, (err, value) => { 
                    if (value === null) {
                        logger.debug('add: ' + sub + ' | ' + key);
                        db.hset(sub, key, val);      
                    }
                });
            }
            catch(e) {logger.error(e);}            
        } 

        db.hgetall(sub, (err, value) => {
            req.docs = value;
            getJob(value.job_uid).then((data) => {
                if (typeof data !== 'undefined'){
                    req.docs.job = {};
                    req.docs.job.state = data.state;
                    req.docs.job.renderProgress = data.renderProgress;
                }
                getJobs().then((data) => {
                    req.docs.qjobs = data.reduce((n, x) => n + (x.state === 'queued'), 0);
                    next();
                }); 
            });                      
        });          
    } 
    else {
        next();
    }
}

module.exports = dbmw;