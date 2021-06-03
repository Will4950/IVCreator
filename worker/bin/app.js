const config = require('src/config');
const { spawn } = require('child_process');
var worker = spawn('nexrender-worker-win64.exe', ['--host=' + config.nexrender.host + ':' + config.nexrender.port, '--no-license', '--secret=' + config.nexrender.secret]);
worker.stdout.on('data', data=>console.log(data.toString()));
