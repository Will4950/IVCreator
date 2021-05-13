const config = require('src/config');
var exec = require('child_process').execFile;
var server = exec('nexrender-server-win64.exe', ['--port=' + config.nexrender.port, '--secret=' + config.nexrender.secret]);
var worker = exec('nexrender-worker-win64.exe', ['--host=http://localhost:' + config.nexrender.port, '--no-license', '--secret=' + config.nexrender.secret]);
