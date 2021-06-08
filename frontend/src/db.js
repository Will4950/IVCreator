const config = require('src/config');
const logger = require('src/logger');
const redis = require("redis");
const flatten = require('flat');
const http = require('http');

const db = redis.createClient({
    url: config.redis_url
});

db.on("error", function(error) {
    logger.error('redis-error: ' + error);
});

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
                    req.qjobs = data.reduce((n, x) => n + (x.state === 'queued'), 0);
                    next();
                }); 
            });                      
        });          
    } 
    else {
        next();
    }
}

module.exports = {dbmw, db};

const getJobs = () =>{
    return new Promise(resolve => {
        const options = {
            method: 'GET',
            hostname: config.nexrender.host,
            port: config.nexrender.port,
            path: '/api/v1/jobs',
            headers: {
                'nexrender-secret': config.nexrender.secret,
                'Content-Type': 'application/json'
            }
        };

        var hcb = (response) => {
            var str = '';

            response.on('data', (chunk) => {
            str += chunk;
            });

            response.on('end', () => {            
                try { 
                    var a = JSON.parse(str);
                    resolve(a);
                } 
                catch(e) {logger.error('getJobs: ' + e);}            
            });
        }

        var req = http.request(options, hcb)
        req.on('error', (e) => {
            logger.error('getJobs: ' + e)
        });
        req.end();
    });
}

const getJob = (uid) =>{
    return new Promise(resolve => {
        const options = {
            method: 'GET',
            hostname: config.nexrender.host,
            port: config.nexrender.port,
            path: '/api/v1/jobs/' + uid,
            headers: {
                'nexrender-secret': config.nexrender.secret,
                'Content-Type': 'application/json'
            }
        };

        var hcb = (response) => {
            var str = '';

            response.on('data', (chunk) => {
            str += chunk;
            });

            response.on('end', () => {            
                try { 
                    var a = JSON.parse(str);
                    resolve(a);
                } 
                catch(e) {
                    resolve('{}');
                }            
            });
        }

        var req = http.request(options, hcb)
        req.on('error', (e) => {
            logger.error('getJob: ' + e)
        });
        req.end();
    });
}