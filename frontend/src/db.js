const logger = require('src/logger');
const Datastore = require('nedb');
const db = new Datastore({ filename: 'db/frontend.db', autoload: true });
const jobdb = new Datastore({ filename: 'db/job.db', autoload: true });
const fs = require('fs');

const sizeCheck = () =>{
    if (fs.statSync('db/frontend.db').size > 524288000) {
        db.persistence.compactDatafile();
    }
    if (fs.statSync('db/job.db').size > 524288000) {
        jobdb.persistence.compactDatafile();
    }
}
setInterval(sizeCheck, 60000);

db.on('compaction.done', () =>{
    logger.silly('db: compaction.done');
});

jobdb.on('compaction.done', () =>{
    logger.silly('jobdb: compaction.done');
});

jobdb.find({sub: 'jobs'}, (err, docs) => {
    if (docs.length == 0){
       jobdb.insert({sub: 'jobs'});
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

            jobdb.find({sub: 'jobs'}, (err, dbdocs) =>{
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

const update_db = (val1, val2, val3, val4) => {
    return new Promise(resolve => {
        db.update({[val1]: val2}, {$set: {[val3]: val4}}, {}, (err, numrep) => {
            resolve();
        });
    });
}

const update_jobdb = (val1, val2, val3, val4) => {
    return new Promise(resolve => {
        jobdb.update({[val1]: val2}, {$set: {[val3]: val4}}, {}, (err, numrep) => {
            resolve();
        });
    });
}

module.exports = {dbmw, update_db, update_jobdb, db, jobdb};