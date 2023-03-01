const appRoot = require('app-root-path').path;
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

const configFile = path.join(appRoot, 'config.json');

let config;

module.exports.load = () => {

    if (config)
        return config;

    try {

        const data = fs.readFileSync(configFile);
        config = JSON.parse(data);
        return config;

    } catch (e) {

        throw new Error("Incorrect config file format");

    }


};

module.exports.mw = (req, res, next) => {

    if(!config)
        throw new Error("Config must be loaded first!");

    logger("App config requested", { app: req.params.appName });
    const app = config.apps[req.params.appName];

    if(!app)
        return res.status(404).json({ results: "KO", message: "App not found!" });

    req.locals = { app };

    next();

}