const http = require('http');
const io = require('socket.io')();
const ss = require('@sap_oss/node-socketio-stream');
const he = require('he');
const sharp = require('sharp');
const { Readable } = require('stream');
const logger = require('src/logger');
const db = require('src/db');
const config = require('./config');

const socketapi = {
    io: io
};

io.on('connection', (socket) => {
    var sid = socket.id
    logger.debug('socket.id: ' + sid);    
    
    ss(socket).on('ss-update-file_4Slide', (stream, data) => {
        logger.debug('ss-update-file_4Slide: ' + data.sub + ' ' + data.image);
        
        var width, height;
        switch(data.image){
            case 'file_4Slide_4':
                width = 620;
                height = 220;
                break;
            default:
                width = 1920;
                height = 1080;
        }

        var sharpTransformOptions = {width: width, height: height, fit: 'inside'};
        var sharpTransform = sharp().resize(sharpTransformOptions);

        var readable = Readable.from(stream);
        readable.pipe(sharpTransform).toBuffer((err, buffer, info) => {
            var img = 'data:image/' + info.format + ';base64,' + buffer.toString('base64');
            db.update({sub: data.sub}, {$set: {[data.image]: img}}, {}, (err, numrep) => {
                logger.debug('update-file_4Slide docs changed: ' + numrep);
                io.to(sid).emit('image', {
                    img: data.image,
                    src: img
                });
            });
        });

        readable.on('error', (e)=>{
            console.error('stream: ' + e);
        })

        sharpTransform.on('error', (e)=>{
            console.error('sharp: ' + e);
        })
    });    

    socket.on('update-text_4Slide', (data) => {
        logger.debug('update-text_4Slide: ' + data.sub + ' ' + data.text);
        db.update({sub: data.sub}, {$set: {[data.text]: data.value}}, {}, (err, numrep) => {
            logger.debug('update-text_4Slide docs changed: ' + numrep);
        });
    });

    socket.on('getJobs', (data) => {
        logger.debug('getJobs: ' + data.sub + ' : ' + data.page);
        var job;
        db.find({sub: data.sub}, (err, docs) => {
            if(docs.length){ job = docs[0].job };            
            getJob(job, sid, data.page);            
        });
    });

    socket.on('createJob', (data) => {
        logger.debug('createJob: ' + data.sub + ' ' + data.page);        
        db.find({sub: data.sub}, (err, docs) => {
            var jobjson,template, assets, postrender;            
            switch (data.page){
                case '4Slides':
                    template  = {
                        "src": config.tsrc,
                        "composition": "Opener Final Comp"
                    }
                    break;
                case '4Slide':
                    template  = {
                        "src": config.tsrc,
                        "composition": "Opener Final Comp w/ Music"
                    }
                    break;
            } 
            assets = [];
            assets.push({"src": docs[0].file_4Slide_4, "type": "image", "layerName": "SCRIPT LOGO"});
            assets.push({"src": docs[0].file_4Slide_1, "type": "image","layerName": "SCRIPT SLIDE1"});
            assets.push({"src": docs[0].file_4Slide_2, "type": "image","layerName": "SCRIPT SLIDE2"});
            assets.push({"src": docs[0].file_4Slide_3, "type": "image","layerName": "SCRIPT SLIDE3"});
            assets.push({ "type": "data","layerName": "SCRIPT MEETING LINE 1","property": "Source Text","value": he.decode(docs[0].text_4Slide_1)});
            assets.push({ "type": "data","layerName": "SCRIPT MEETING LINE 2","property": "Source Text","value": he.decode(docs[0].text_4Slide_2)});
            postrender=[];
            postrender.push({"module": "@nexrender/action-encode", "preset": "mp4","output": "encoded.mp4"});
            postrender.push({"module": "@nexrender/action-copy", "input": "encoded.mp4", "output": config.output + docs[0].sub + ".mp4"});

            jobjson = {};
            jobjson.template = template;
            jobjson.assets = assets;
            jobjson.actions = {};
            jobjson.actions.postrender = postrender;
            
            postJob(data.sub, jobjson);
        });
    });

});

const postJob = (sub, job) => {
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

    var hcb = function(response) {
        var str = '';

        response.on('data', function (chunk) {
          str += chunk;
        });

        response.on('end', function () { 
            try {
                var a = JSON.parse(str);
            } catch(e) {
                logger.error('postJob: ' + e);
            }
            logger.debug('createJob uid: ' + a.uid);
            logger.debug('createJob sub: ' + sub);             
            db.update({sub: sub}, {$set: {job: a.uid}}, {}, (err, numrep) => {
                logger.debug('postJob docs changed: ' + numrep);
            });    
        });
    }
    
    try {
        var a = JSON.stringify(job);                
    } catch(e) {
        logger.error('postJob: ' + e);
    }

    var req = http.request(options, hcb);
    req.on('error', (e) => {
        logger.error('postJob: ' + e)
    });
    req.write(a);    
    req.end();
};

const getJob = (job, sid, page) =>{
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
            } catch(e) {
                logger.error('getJob: ' + e);
            }

            var qjobs = a.reduce((n, x) => n + (x.state === 'queued'), 0);
            var cjob = a.filter(c => c.uid === job);

            logger.silly('cjob: ' + JSON.stringify(cjob));

            io.to(sid).emit('jobs', {
                qjobs: qjobs,
                cjob: cjob,
                page: page
            });
        });
    }

    var req = http.request(options, hcb)
    req.on('error', (e) => {
        logger.error('getJobs: ' + e)
    });
    req.end();
}

module.exports = socketapi;