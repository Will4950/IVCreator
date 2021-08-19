const http = require('http');
const config = require('src/config');
const logger = require('src/logger');
const db = require('src/redis');

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

            response.on('data', (chunk) => {str += chunk;});

            response.on('end', () => {            
                try { 
                    var a = JSON.parse(str);
                    resolve(a);
                } 
                catch(e) {logger.error('getJobs: ' + e);}            
            });
        }
        var req = http.request(options, hcb)
        req.on('error', (e) => {logger.error('getJobs: ' + e)});
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
            response.on('data', (chunk) => {str += chunk;});
            response.on('end', () => {            
                try { 
                    var a = JSON.parse(str);
                    resolve(a);
                } 
                catch(e) {resolve('{}');}            
            });
        }
        var req = http.request(options, hcb)
        req.on('error', (e) => {logger.error('getJob: ' + e)});
        req.end();
    });
}

const postJob = (sub, job) => {
    return new Promise(resolve => {
        const options = {
            method: 'POST',
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
            response.on('data', (chunk) => {str += chunk;});
            response.on('end', () => { 
                try {
                    var a = JSON.parse(str);
                    if (typeof a.uid !== 'null' && typeof a.uid !== 'undefined') {
                        db.hset(sub, 'job_uid', a.uid, (err, value) => resolve());
                    }
                } 
                catch(e) {logger.error('postJob res: ' + e);}                
            });
        }
        try {var a = JSON.stringify(job);} 
        catch(e) {logger.error('postJob: ' + e);}
        var req = http.request(options, hcb);
        req.on('error', (e) => {logger.error('postJob: ' + e)});    
        req.write(a);    
        req.end();
    });
}

module.exports = {getJob, getJobs, postJob}