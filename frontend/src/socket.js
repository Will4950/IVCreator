const io = require('socket.io')();
const logger = require('src/logger');
const config = require('src/config');
const ss = require('@sap_oss/node-socketio-stream');
const {update_jobdb, update_db, db} = require('src/db');
const { Readable } = require('stream');
const sharp = require('sharp');
const he = require('he');
const http = require('http');

const socketapi = {io: io};

io.on('connection', (socket) => {
    logger.debug('sid: ' + socket.id)
    sid = socket.id;

    socket.on('upload_text', (data) =>{
        logger.debug('upload_text: ' + data.text + ' | ' +  data.sub);
        update_db('sub', data.sub, data.text, data.value).then(() => {
            io.to(sid).emit('upload_text', {text: data.text});
        })
    })

    ss(socket).on('upload_image', (stream, data) => {
        logger.debug('upload_image: ' + data.image + ' | ' + data.sub);
        
        var width=1920, height=1080;
        if (data.image === 'file_template_4Slide_4'){ width = 620; height = 220;}
        if (data.image === 'file_template_Welcome_1'){width = 620; height = 220;}
        if (data.image === 'file_template_SS_4'){width = 620; height = 220;}    
        var sharpTransform = sharp().resize({width: width, height: height, fit: 'inside'}).toFormat('png');
    
        var readable = Readable.from(stream);
        readable.pipe(sharpTransform).toBuffer((err, buffer, info) => {
            try{var img = 'data:image/png;base64,' + buffer.toString('base64');}
            catch(e){logger.error('upload_image: ' + e);}
            update_db('sub', data.sub, data.image, img).then(()=>{
                io.to(sid).emit('upload_image', {
                    image: data.image,
                    src: img
                });
            });
        })
    
        readable.on('error', (e)=>{
            console.error('stream: ' + e);
        })
    
        sharpTransform.on('error', (e)=>{
            console.error('sharp: ' + e);
        })
    });

    socket.on('create_job', (data) =>{
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
                case 'SS': template  = {"src": config.template_SS, "composition": "Comp 1"}
                    break;
            }
            assets = [];
            switch(data.template){
                case 'Welcome':
                    assets.push({"src": docs[0].file_template_Welcome_1, "type": "image","layerName": "SCRIPT IMAGE 1"});
                    break;
                case 'SS':
                    assets.push({"src": docs[0].file_template_SS_1, "type": "image","layerName": "SCRIPT IMAGE 1"});
                    assets.push({"src": docs[0].file_template_SS_2, "type": "image","layerName": "SCRIPT IMAGE 2"});
                    assets.push({"src": docs[0].file_template_SS_3, "type": "image","layerName": "SCRIPT IMAGE 3"});
                    assets.push({"src": docs[0].file_template_SS_4, "type": "image","layerName": "SCRIPT IMAGE 4"});
                    assets.push({ "type": "data","layerName": "SCRIPT TEXT 1","property": "Source Text","value": he.decode(docs[0].text_template_SS_1)});
                    assets.push({ "type": "data","layerName": "SCRIPT TEXT 2","property": "Source Text","value": he.decode(docs[0].text_template_SS_2)});
                    assets.push({ "type": "data","layerName": "SCRIPT TEXT 3","property": "Source Text","value": he.decode(docs[0].text_template_SS_3)});
                    assets.push({ "type": "data","layerName": "SCRIPT TEXT 4","property": "Source Text","value": he.decode(docs[0].text_template_SS_4)});
                    break;
                case '4Slide-short':
                case '4Slide-alt':
                case '4Slide-alt-short':
                case '4Slide':
                    assets.push({"src": docs[0].file_template_4Slide_4, "type": "image","layerName": "SCRIPT LOGO"});
                    assets.push({"src": docs[0].file_template_4Slide_1, "type": "image","layerName": "SCRIPT SLIDE1"});
                    assets.push({"src": docs[0].file_template_4Slide_2, "type": "image","layerName": "SCRIPT SLIDE2"});
                    assets.push({"src": docs[0].file_template_4Slide_3, "type": "image","layerName": "SCRIPT SLIDE3"});
                    assets.push({ "type": "data","layerName": "SCRIPT MEETING LINE 1","property": "Source Text","value": he.decode(docs[0].text_template_4Slide_1)});
                    assets.push({ "type": "data","layerName": "SCRIPT MEETING LINE 2","property": "Source Text","value": he.decode(docs[0].text_template_4Slide_2)});
                    assets.push({ "type": "data","layerName": "SCRIPT MEETING LINE 3","property": "Source Text","value": he.decode(docs[0].text_template_4Slide_3)});
                    assets.push({ "type": "data","layerName": "SCRIPT MEETING LINE 4","property": "Source Text","value": he.decode(docs[0].text_template_4Slide_4)});
                    break;
            }
            
            postrender=[];
            postrender.push({"module": "@nexrender/action-encode", "preset": "mp4","output": "encoded.mp4"});
            postrender.push({"module": "@nexrender/action-copy", "input": "encoded.mp4", "output": config.output + docs[0].sub + ".mp4"});
    
            jobjson = {};
            jobjson.template = template;
            jobjson.assets = assets;
            jobjson.actions = {};
            jobjson.actions.postrender = postrender;
            postJob(data.sub, jobjson).then(() => {io.to(sid).emit('create_job');});
        });
    });
});

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

            response.on('data', (chunk) => {
            str += chunk;
            });

            response.on('end', () => { 
                try {
                    var a = JSON.parse(str)
                    update_db('sub', sub, 'job', a).then(() => {getJobs().then(() => {resolve();})});    
                } 
                catch(e) { 
                    logger.error('postJob res: ' + e);
                    update_db('sub', sub, 'job', false).then(()=>{resolve();}); 
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
    });
}

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
                    update_jobdb('sub', 'jobs', 'a', a).then(()=>{resolve();});
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

setInterval(getJobs, 10000);

module.exports = socketapi;