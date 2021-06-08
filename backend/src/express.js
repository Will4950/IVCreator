const express = require('express');
const expressWinston = require('express-winston');
const config = require('src/config');
const logger = require('src/logger');
const {createHandler} = require('@nexrender/server');

const nexmw = (req, res) => {
    const handler = createHandler(config.nexrender.secret);
    handler(req, res);
}

const app = express();
app.set('port', config.port);
app.use(expressWinston.logger({winstonInstance: logger}));
app.use(nexmw);

app.use(function(req, res) {
    res.status(404).send('404');
});

app.use(function(error, req, res, next) {
    res.status(500).send('500');
});

module.exports = app;