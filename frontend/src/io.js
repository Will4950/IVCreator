const io = require('socket.io')();
const logger = require('src/logger');
const config = require('src/config');
const {db, getJobs} = require('src/db');
const ss = require('@sap_oss/node-socketio-stream');
const { Readable } = require('stream');
const sharp = require('sharp');
const he = require('he');
const http = require('http');

const socketapi = {io: io};

io.on('connection', (socket) => {
    logger.debug('io: ' + socket.id)
    sid = socket.id;

    socket.on('upload_text', (data) =>{
        logger.debug('upload_text: ' + data.text + ' | ' +  data.sub);
        db.update({sub: data.sub}, {$set: {[data.text]: data.value}}, {}, (err, numrep) => {
            io.to(sid).emit('upload_text', {text: data.text});
        });
    });

    ss(socket).on('upload_image', (stream, data) => {
        logger.debug('upload_image: ' + data.sub + ' | ' + data.image);
        
        var width=1920, height=1080;
        if (data.image === 'file_template_4Slide_4'){
            width = 620; height = 220;
        }
        if (data.image === 'file_template_Welcome_1'){
            width = 620; height = 220;
        }

        var sharpTransform = sharp().resize({width: width, height: height, fit: 'inside'});

        var readable = Readable.from(stream);
        readable.pipe(sharpTransform).toBuffer((err, buffer, info) => {
            try{var img = 'data:image/' + info.format + ';base64,' + buffer.toString('base64');}
            catch(e){logger.error('upload_image: ' + e);}
            db.update({sub: data.sub}, {$set: {[data.image]: img}}, {}, (err, numrep) => {
                io.to(sid).emit('upload_image', {
                    image: data.image,
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

    socket.on('createJob', (data) =>{
        logger.debug('createJob: ' + data.sub + ' ' + data.template);        
        db.find({sub: data.sub}, (err, docs) => {
            var jobjson,template, assets, postrender;            
            switch (data.template){
                case '4Slide': template  = {"src": config.template_4Slide, "composition": "Opener Final Comp w/ Music"}
                    break;
                case '4Slide-short': template  = {"src": config.template_4Slide, "composition": "Opener Final Comp"}
                    break;
                case '4Slide-alt': template  = {"src": config.template_4Slide_alt, "composition": "Opener Final Comp w/ Music"}
                    break;                
                case '4Slide-alt-short': template  = {"src": config.template_4Slide_alt, "composition": "Opener Final Comp"}
                    break;
                case 'Welcome': template  = {"src": config.template_Welcome, "composition": "Render"}
                    break;
            }
            assets = [];
            if (data.template === 'Welcome'){
                assets.push({"src": docs[0].file_template_Welcome_1, "type": "image","layerName": "SCRIPT IMAGE 1"});                
            }
            else {
                assets.push({"src": docs[0].file_template_4Slide_4, "type": "image", "layerName": "SCRIPT LOGO"});
                assets.push({"src": docs[0].file_template_4Slide_1, "type": "image","layerName": "SCRIPT SLIDE1"});
                assets.push({"src": docs[0].file_template_4Slide_2, "type": "image","layerName": "SCRIPT SLIDE2"});
                assets.push({"src": docs[0].file_template_4Slide_3, "type": "image","layerName": "SCRIPT SLIDE3"});
                assets.push({ "type": "data","layerName": "SCRIPT MEETING LINE 1","property": "Source Text","value": he.decode(docs[0].text_template_4Slide_1)});
                assets.push({ "type": "data","layerName": "SCRIPT MEETING LINE 2","property": "Source Text","value": he.decode(docs[0].text_template_4Slide_2)});
                assets.push({ "type": "data","layerName": "SCRIPT MEETING LINE 3","property": "Source Text","value": he.decode(docs[0].text_template_4Slide_3)});
                assets.push({ "type": "data","layerName": "SCRIPT MEETING LINE 4","property": "Source Text","value": he.decode(docs[0].text_template_4Slide_4)});
            }

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
                var a = JSON.parse(str)
                db.update({sub: sub}, {$set: {job: a}}, {}, (err, numrep) => {
                    getJobs();
                    io.to(sid).emit('createJob', {
                        status: 'ok'
                    });
                });                 
            } 
            catch(e) { 
                logger.error('postJob res: ' + e);
                db.update({sub: sub}, {$set: {job: false}}, {}, (err, numrep) => {
                    getJobs();
                    io.to(sid).emit('createJob', {
                        status: 'error'
                    });
                });
            }
            
        });
    }
    
    try {var a = JSON.stringify(job);} 
    catch(e) {logger.error('postJob: ' + e);}
    var req = http.request(options, hcb);
    req.on('error', (e) => {
        logger.error('postJob: ' + e)
    });    
    req.write(a);    
    req.end();
};

module.exports = socketapi;
