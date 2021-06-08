const redis = require("redis");
const config = require('src/config');
const logger = require('src/logger');

const redisClient = redis.createClient({
    url: config.redis_url
});

redisClient.on("error", function(error) {
    logger.error('redis-error: ' + error);
});

module.exports = redisClient;