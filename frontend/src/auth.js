const config = require('src/config');
const logger = require('src/logger');
const db = require('src/db');
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

const authroute = (req, res, route) => {
    if (req.userContext) {
        if(req.userContext.userinfo) {
            const userinfo = req.userContext && req.userContext.userinfo;
            const attributes = Object.entries(userinfo);
            
            var sub = userinfo.sub;
            logger.debug('sub: ' + sub);            
            var doc = config.doc;
            doc['sub'] = sub;

            db.find({sub: sub}, (err, docs) =>{
                if (docs.length == 0) {
                    db.insert(doc, (err, newDoc) => {
                        res.render(route, { 
                            authorized: !!userinfo,
                            userinfo: userinfo,
                            attributes,
                            docs: newDoc
                        });
                    });
                }
                else {
                    res.render(route, { 
                        authorized: !!userinfo,
                        userinfo: userinfo,
                        attributes,
                        docs: docs
                    });
                }
            });            
        }
    } else {
        res.render(route, { 
            authorized: false,
        });
    }
};

module.exports = {oidc, authroute};