const config = require('src/config');
const server = require('src/http');
const logger = require('src/logger');
const auth = require('src/auth');

console.log = (msg) => {
    logger.debug(msg);
}

console.error = (msg) => {
    logger.error(msg);
}

auth.oidc.on('ready', () =>{
    logger.debug('oidc ready');
    server.listen(config.port, config.host);
});

auth.oidc.on("error", err => {
	logger.error(err);
});