const http = require('http');
const io = require('socket.io')();
var ss = require('@sap_oss/node-socketio-stream');
const he = require('he');
const { Readable } = require('stream');
const sharp = require('sharp');
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
        
        var file = '';
        var readable = Readable.from(stream);
        readable.on('error', (e) => {
            logger.debug('ss-update-file_4Slide: ' + e);
        })
        readable.on('data', (chunk) => {
            file += chunk;
        })
        readable.on('end', () =>{
            var front = file.split(',')[0]
            var back = file.split(',')[1];
            var img = Buffer.from(back, 'base64');
            var width=1920, height=1080;
            switch(data.image){
                case 'file_4Slide_4':
                    width = 620;
                    height = 220;
                default:             
                    sharp(img).resize({width: width, height: height, fit: 'inside'}).toBuffer()
                    .then((imgrs)=>{
                        db.update({sub: data.sub}, {$set: {[data.image]: front + ',' + imgrs.toString('base64')}}, {}, (err, numrep) => {
                            logger.debug('update-file_4Slide docs changed: ' + numrep);
                        });                            
                    }).catch(e => {logger.error('sharp: ' + e)});                    
        }
            
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
        var job = '';
        db.find({sub: data.sub}, (err, docs) => {
            if(docs.length){ job = docs[0].job };            
            getJob(job, sid, data.page);            
        });
    });

    socket.on('createJob', (data) => {
        logger.debug('createJob: ' + data.sub + ' ' + data.page);        
        db.find({sub: data.sub}, (err, docs) => {
            var jobjson = '';
            switch (data.page){
                case '4Slide':
                        jobjson = {
                            "template": {
                            "src": config.tsrc,
                            "composition": config.comp
                            },
                            "assets": [
                                {
                                    "src": docs[0].file_4Slide_4,
                                    "type": "image",
                                    "layerName": "SCRIPT LOGO"
                                },
                                {
                                    "src": docs[0].file_4Slide_1,
                                    "type": "image",
                                    "layerName": "SCRIPT SLIDE1"
                                },
                                {
                                    "src": docs[0].file_4Slide_2,
                                    "type": "image",
                                    "layerName": "SCRIPT SLIDE2"
                                },
                                {
                                    "src": docs[0].file_4Slide_3,
                                    "type": "image",
                                    "layerName": "SCRIPT SLIDE3"
                                },
                                {
                                    "type": "data",
                                    "layerName": "SCRIPT MEETING LINE 1",
                                    "property": "Source Text",
                                    "value": he.decode(docs[0].text_4Slide_1)
                                },
                                {
                                    "type": "data",
                                    "layerName": "SCRIPT MEETING LINE 2",
                                    "property": "Source Text",
                                    "value": he.decode(docs[0].text_4Slide_2)
                                }
                            ],
                            "actions": {
                                "postrender": [
                                    {
                                    "module": "@nexrender/action-encode",
                                    "preset": "mp4",
                                    "output": "encoded.mp4"
                                    },
                                    {
                                    "module": "@nexrender/action-copy",
                                    "input": "encoded.mp4",
                                    "output": config.output + docs[0].sub + ".mp4"
                                    }
                                ]
                            }
                        }
                    break;
                case '4Slides':
                        jobjson = {
                            "template": {
                            "src": config.tsrc,
                            "composition": 'Opener Final Comp'
                            },
                            "assets": [
                                {
                                    "src": docs[0].file_4Slide_4,
                                    "type": "image",
                                    "layerName": "SCRIPT LOGO"
                                },
                                {
                                    "src": docs[0].file_4Slide_1,
                                    "type": "image",
                                    "layerName": "SCRIPT SLIDE1"
                                },
                                {
                                    "src": docs[0].file_4Slide_2,
                                    "type": "image",
                                    "layerName": "SCRIPT SLIDE2"
                                },
                                {
                                    "src": docs[0].file_4Slide_3,
                                    "type": "image",
                                    "layerName": "SCRIPT SLIDE3"
                                },
                                {
                                    "type": "data",
                                    "layerName": "SCRIPT MEETING LINE 1",
                                    "property": "Source Text",
                                    "value": he.decode(docs[0].text_4Slide_1)
                                },
                                {
                                    "type": "data",
                                    "layerName": "SCRIPT MEETING LINE 2",
                                    "property": "Source Text",
                                    "value": he.decode(docs[0].text_4Slide_2)
                                }
                            ],
                            "actions": {
                                "postrender": [
                                    {
                                    "module": "@nexrender/action-encode",
                                    "preset": "mp4",
                                    "output": "encoded.mp4"
                                    },
                                    {
                                    "module": "@nexrender/action-copy",
                                    "input": "encoded.mp4",
                                    "output": config.output + docs[0].sub + ".mp4"
                                    }
                                ]
                            }
                        }
                    break;
            }            
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