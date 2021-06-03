const config = require('src/config');
const { spawn } = require('child_process');
var server = spawn('nexrender-server-win64.exe', ['--port=' + config.nexrender.port, '--secret=' + config.nexrender.secret]);
server.stdout.on('data', data=>console.log(data.toString()));
