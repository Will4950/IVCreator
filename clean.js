const fs = require('fs');
fs.rmdir('node_modules',{recursive:true},err=>{return;});
fs.rmdir('backend/node_modules',{recursive:true},err=>{return;});
fs.rmdir('frontend/node_modules',{recursive:true},err=>{return;});
fs.rmdir('worker/node_modules',{recursive:true},err=>{return;});
fs.rm('frontend/db/frontend.db',err=>{return;});
fs.rm('frontend/db/job.db',err=>{return;});
fs.rm('frontend/public/stylesheets/compiled.css',err=>{return;});
fs.rm('frontend/public/stylesheets/compiled.css.map',err=>{return;});

rmDir = function(dirPath) {
    try { var files = fs.readdirSync(dirPath); }
    catch(e) { return; }
    files.forEach((item) => {
    var filePath = dirPath + '/' + item;
    if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
    else
        rmDir(filePath);
    }) 
};

rmDir('frontend/public/download');

var exec = require('child_process').execFile;
exec('backend/nexrender-server-win64.exe', ['--cleanup']);