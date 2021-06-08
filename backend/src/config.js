require('dotenv').config();

var config = {};
config.port = process.env.PORT || '9292';
config.host = process.env.HOST || '0.0.0.0';

config.nexrender = {};
config.nexrender.secret = process.env.NEXRENDER_SECRET || 'ivcreator';

module.exports = config;