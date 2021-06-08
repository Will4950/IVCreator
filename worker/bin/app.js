const config = require('src/config');
const logger = require('src/logger');
const { start } = require('@nexrender/worker');

const main = async () => {
    const serverHost = config.nexrender.host + ':' + config.nexrender.port;

    await start(serverHost, config.nexrender.secret, {
        workpath: config.nexrender.workpath,
        multiFrames: true,
        addLicense: (config.nexrender.license === 'true')
    })
}

console.log = data => logger.debug(data);
console.warn = data => logger.warn(data);
console.error = data => logger.error(data);

main().catch(logger.error);