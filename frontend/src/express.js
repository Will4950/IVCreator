const express = require('express');
const expressWinston = require('express-winston');
const config = require('src/config');
const logger = require('src/logger');
const {oidc, authmw} = require('src/middleware/auth');
const dbmw = require('src/middleware/dbmw');
const fsmw = require('src/middleware/fs');
const sessionmw = require('src/middleware/session');
const routes = require('src/routes');
const app = express();

app.set('port', config.port);
app.set('view engine', 'pug');
app.set('views', 'views');

app.use(express.static('public/assets'));
app.use(express.static('public/js'));
app.use(express.static('public/stylesheets'));
app.use(express.static('node_modules/bootstrap/dist/js'));
app.use(express.static('node_modules/@popperjs/core/dist/umd'));
app.use(express.static('node_modules/jquery/dist'));
app.use('/socket-stream', express.static('node_modules/@sap_oss/node-socketio-stream'));
app.use('/fontawesome', express.static('node_modules/@fortawesome/fontawesome-free/webfonts'));
app.use('/download', express.static('public/download'));
app.use(express.json({limit:'100MB'}));
app.use(express.urlencoded({extended: false, limit:'100MB'}));
app.use(expressWinston.logger({winstonInstance: logger}));
app.use(sessionmw);
app.use(oidc.router);
app.use(authmw);
app.use(dbmw);
app.use(fsmw);
app.use(routes);

module.exports = app;