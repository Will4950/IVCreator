const http = require('http');
const config = require('src/config');
const app = require('src/express');
const logger = require('src/logger');
const server = http.createServer(app);
const socketapi = require('src/socket');
socketapi.io.attach(server);
const {oidc} = require('src/middleware/auth');

const onError = (error) => {
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

const onListening = () => {
	var addr = server.address();
	var bind = typeof addr === 'string'	? 'pipe ' + addr : 'port ' + addr.port;
	logger.debug('http | listening on ' + bind);
}

console.log = data => logger.debug(data);
console.warn = data => logger.warn(data);
console.error = data => logger.error(data);

server.on('error', onError);
server.on('listening', onListening);

oidc.on('ready', () =>{
    logger.debug('oidc ready');
    server.listen(config.port, config.host);
});

oidc.on("error", err => {
	logger.error(err);
});
