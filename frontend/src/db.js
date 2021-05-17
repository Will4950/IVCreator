const logger = require('src/logger');
const config = require('src/config');
const http = require('http');
const Datastore = require('nedb');
const db = new Datastore({ filename: 'db/frontend.db', autoload: true });
const fs = require('fs');

const sizeCheck = () =>{
    if (fs.statSync('db/frontend.db').size > 524288000) {
        db.persistence.compactDatafile();
    }
}
setInterval(sizeCheck, 60000);

db.on('compaction.done', () =>{
    logger.silly('db: compaction.done');
});

db.find({sub: 'jobs'}, (err, docs) => {
    if (docs.length == 0){
        db.insert({sub: 'jobs'});
    }
})

const dbmw = (req, res, next) => {
    if (req.auth){
        var docs, job, qjobs = 0;
        const userinfo = req.userContext && req.userContext.userinfo;
        var sub = userinfo.sub;
        var doc = require('src/doc');
        doc['sub'] = sub;
        
        db.find({sub: sub}, (err, dbdocs) =>{
            switch(dbdocs.length){
                case 0:
                    db.insert(doc, (err, newdoc) =>{
                        docs = newdoc[0];
                        job = false;
                    });
                    break;
                default:
                    docs = dbdocs[0];
                    var obj = doc;
                    var keys = Object.keys(obj);
                    keys.forEach((item, index) => {
                        if (typeof docs[item] === 'undefined'){
                            docs[item] = obj[item];
                            db.update({sub: sub}, {$set: {[item]: obj[item]}}, {});
                        }
                    })
                    job = dbdocs[0].job;
            }

            db.find({sub: 'jobs'}, (err, dbdocs) =>{
                if(typeof dbdocs[0].a != 'undefined'){
                    qjobs = dbdocs[0].a.reduce((n, x) => n + (x.state === 'queued'), 0);
                    if (job) {                      
                        job = dbdocs[0].a.filter(c => c.uid === job.uid)[0];
                    }
                }                
                req.sub = sub; 
                req.docs = docs; 
                req.qjobs = qjobs; 
                req.job = job;
                next();
            });
        });
    } 
    else {
        next();
    }
}

const getJobs = () =>{
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

    var hcb = function(response) {
        var str = '';

        response.on('data', function (chunk) {
          str += chunk;
        });

        response.on('end', function () {            
            try { 
                var a = JSON.parse(str);
                db.update({sub: 'jobs'}, {$set: {a: a}}, {});
            } 
            catch(e) {logger.error('getJobs: ' + e);}
            
        });
    }

    var req = http.request(options, hcb)
    req.on('error', (e) => {
        logger.error('getJobs: ' + e)
    });

    req.end();

}

setInterval(getJobs, 10000);
module.exports = {db, dbmw, getJobs};
