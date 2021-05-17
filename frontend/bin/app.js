const config = require('src/config');
const server = require('src/http');
const logger = require('src/logger');
const {oidc} = require('src/auth');

oidc.on('ready', () =>{
    logger.debug('oidc ready');
    server.listen(config.port, config.host);
});

oidc.on("error", err => {
	logger.error(err);
});
