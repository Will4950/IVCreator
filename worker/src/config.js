require('dotenv').config();

var config = {};
config.nexrender = {};
config.nexrender.host = process.env.NEXRENDER_HOST || 'http://localhost';
config.nexrender.port = process.env.NEXRENDER_PORT || '9292';
config.nexrender.secret = process.env.NEXRENDER_SECRET || 'ivcreator';
config.nexrender.workpath = process.env.NEXRENDER_WORKPATH || 'd:\\work';
config.nexrender.license = process.env.NEXRENDER_LICENSE || false;

module.exports = config;