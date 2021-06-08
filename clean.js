const fs = require('fs');
fs.rmdir('node_modules',{recursive:true},err=>{return;});
fs.rmdir('backend/node_modules',{recursive:true},err=>{return;});
fs.rmdir('frontend/node_modules',{recursive:true},err=>{return;});
fs.rmdir('worker/node_modules',{recursive:true},err=>{return;});

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

fs.rm('frontend/public/stylesheets/compiled.css',err=>{return;});
fs.rm('frontend/public/stylesheets/compiled.css.map',err=>{return;});