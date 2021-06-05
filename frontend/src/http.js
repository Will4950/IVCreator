const http = require('http');
const app = require('src/express');
require('src/routes');
const logger = require('src/logger');
const server = http.createServer(app);
const socketapi = require('src/socket');
socketapi.io.attach(server);

server.on('error', onError);
server.on('listening', onListening);


function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	var bind = typeof port === 'string'	? 'Pipe ' + port : 'Port ' + port;

	switch (error.code) {
		case 'EACCES':
			logger.error('http | ' + bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			logger.error('http | ' + bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}
}

function onListening() {
	var addr = server.address();
	var bind = typeof addr === 'string'	? 'pipe ' + addr : 'port ' + addr.port;
	logger.debug('http | listening on ' + bind);
}

module.exports = server;
