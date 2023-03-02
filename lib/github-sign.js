const crypto = require('crypto');
const logger = require('./logger');


module.exports.mw = (req, res, next) => {

    if(!req.locals.app.githubSecret)
        return next();

    const sign = req.headers['x-hub-signature'];

    if(!sign) {
        logger("Missing sign!");
        return res.status(400).json({results: 'KO', message: 'Missing sign!'});
    }

    const hash = "sha1=" + crypto.createHmac('sha1', req.locals.app.githubSecret).update(JSON.stringify(req.body)).digest('hex');

    if(hash !== sign) {
        logger("Incorrect sign!", { received: sign, expected: hash });
        return res.status(401).json({results: 'KO', message: 'Incorrect sign!'});
    }

    next();

};

