const {access, constants} = require('fs');

module.exports =  (req, res, next) => {
    req.download = false;    
    if (req.auth && req.sub){
        access('public/' + req.sub + '.mp4', constants.F_OK, (err) => {
            if (!err){
                req.download = true;
            }
            next();
        })
    }
    else{
        next();
    }
}