const session = require('express-session');
const config = require('src/config');

module.exports = session({
    cookie: { httpOnly: true },
      secret: config.secret,
      resave: true,
      saveUninitialized: false,
});