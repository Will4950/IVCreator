const logger = require('src/logger');
const config = require('src/config');
const {db, getJobs} = require('src/db');
const { Readable } = require('stream');
const sharp = require('sharp');
const he = require('he');
const http = require('http');

const uploadText = (req, res) => {
    try{
        logger.debug('upload_text: ' + req.body.text + ' | ' +  req.body.sub);
        db.update({sub: req.body.sub}, {$set: {[req.body.text]: req.body.value}}, {}, (err, numrep) => {
            res.send({text: req.body.text}).end();
        });
    }
    catch(e){logger.error(e);}  
}

const uploadImage = (req, res) => {
    try{
        logger.debug('upload_image: ' + req.body.sub + ' | ' + req.body.image);
        
        var width=1920, height=1080;
        if (req.body.image === 'file_template_4Slide_4'){width = 620; height = 220;}
        if (req.body.image === 'file_template_Welcome_1'){width = 620; height = 220;}
        if (req.body.image === 'file_template_SS_4'){width = 620; height = 220;}
        var sharpTransform = sharp().resize({width: width, height: height, fit: 'inside'}).png({force: true});

        var readable = Readable.from(req.file.buffer);
        readable.pipe(sharpTransform).toBuffer((err, buffer, info) => {
            try{var img = 'data:image/png;base64,' + buffer.toString('base64');}
            catch(e){logger.error('upload_image: ' + e);}
            db.update({sub: req.body.sub}, {$set: {[req.body.image]: img}}, {}, (err, numrep) => {
                res.send({image: req.body.image, src: img}).end();
            });
        });
        readable.on('error', (e)=>{
            logger.error('stream: ' + e);
        })
        sharpTransform.on('error', (e)=>{
            logger.error('sharp: ' + e);
        }) 
    } 
    catch(e){logger.error(e);}  
}

const createJob = (req, res) => {
    logger.debug('createJob: ' + req.body.sub + ' ' + req.body.template);        
    db.find({sub: req.body.sub}, (err, docs) => {
        var jobjson,template, assets, postrender;            
        switch (req.body.template){
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
        switch(req.body.template){
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
        postJob(req.body.sub, jobjson, res);
    });
}

const postJob = (sub, job, res) => {
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
                    res.end();
                });                 
            } 
            catch(e) { 
                logger.error('postJob res: ' + e);
                db.update({sub: sub}, {$set: {job: false}}, {}, (err, numrep) => {
                    getJobs();
                    res.end();
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

module.exports =  {uploadText, uploadImage, createJob}