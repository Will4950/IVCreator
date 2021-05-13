const fs = require('fs');
fs.rmdir('node_modules',{recursive:true},err=>{return;});
fs.rmdir('backend/node_modules',{recursive:true},err=>{return;});
fs.rmdir('frontend/node_modules',{recursive:true},err=>{return;});
fs.rmdir('frontend/logs',{recursive:true},err=>{return;});
fs.rm('frontend/stylesheets/bootstrap.css.map',err=>{return;});
fs.rm('frontend/stylesheets/bootstrap.css',err=>{return;});
fs.rm('frontend/db/frontend.db',err=>{return;});

var exec = require('child_process').execFile;
var server = exec('backend/nexrender-server-win64.exe', ['--cleanup']);