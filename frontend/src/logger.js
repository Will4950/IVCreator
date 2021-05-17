const winston = require('winston');

const logger = winston.createLogger({
    transports: [
        new winston.transports.Console({
            level: 'silly',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({
                    format: 'DD-MM:HH:mm:ss'
                }),
                winston.format.printf(info => `[${info.timestamp}] [${info.level}] : ${info.message}`)
            )
        }),
    ]
});

logger.stream = {
    write: function(message, encoding){
        logger.info(message.trim());
    }
};

module.exports = logger;
