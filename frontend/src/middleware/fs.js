const {access, constants} = require('fs');

module.exports =  (req, res, next) => {
    if (typeof req.docs === 'undefined') req.docs = {};
    req.docs.download = false;    
    if (req.auth && req.sub){
        access('public/download/' + req.sub + '.mp4', constants.F_OK, (err) => {
            if (!err){
                req.docs.download = true;
            }
            next();
        })
    }
    else{
        next();
    }
}