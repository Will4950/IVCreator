require('dotenv').config();

var config = {};
config.port = process.env.PORT || '9393';
config.host = process.env.HOST || '0.0.0.0';
config.secret = process.env.SECRET || 'ivrcreatorivr1324;1324kafg/adsfkjjk94creatorasdfivrcKJHDFJKHGJhblkassdreatorivrcreatorasdfivrcreator';
config.output = process.env.OUTPUT || 'd:/';

config.nexrender = {};
config.nexrender.host = process.env.NEXRENDER_HOST || 'localhost'
config.nexrender.port = process.env.NEXRENDER_PORT || '9292';
config.nexrender.secret = process.env.NEXRENDER_SECRET || 'ivcreator';

config.okta = {};
config.okta.org_url = process.env.OKTA_ORG_URL;
config.okta.client_id = process.env.OKTA_CLIENT_ID;
config.okta.client_secret = process.env.OKTA_CLIENT_SECRET;
config.okta.appBaseUrl = process.env.OKTA_APPBASEURL || 'http://' + config.host + ':' + config.port;
config.okta.redirect_uri = config.okta.appBaseUrl + '/authorization-code/callback';

config.template_4Slide = process.env.TEMPLATE_4Slide; 
config.template_4Slide_alt = process.env.TEMPLATE_4Slide_alt; 
config.template_Welcome = process.env.TEMPLATE_WELCOME; 
config.template_SS = process.env.TEMPLATE_SS;

module.exports = config;