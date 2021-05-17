const config = require('src/config');
const ExpressOIDC = require('@okta/oidc-middleware').ExpressOIDC;

const oidc = new ExpressOIDC({
    issuer: config.okta.org_url + '/oauth2/default',
    client_id: config.okta.client_id,
    client_secret: config.okta.client_secret,
    redirect_uri: config.okta.redirect_uri,
    appBaseUrl: config.okta.appBaseUrl,
    routes: {    
        loginCallback: {
            afterCallback: '/'
        }
    },
    scope: 'openid profile'
});

const authmw = (req, res, next) => {
    req.auth = !!req.userContext;
    next();
}

module.exports = {oidc, authmw};
