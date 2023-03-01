const express = require('express');
const bodyParser = require('body-parser');
const childProcess = require('child_process');


const githubSign = require('./lib/github-sign');
const configManager = require('./lib/config');
const logger = require('./lib/logger');

const config = configManager.load();
const app = express();
app.use(bodyParser.json());



app.post('/app/:appName', configManager.mw, githubSign.mw, async (req, res) => {

    res.json({ results: "OK", message: "Done!" });

    const app = req.locals.app;

    const cmd = 'cd ' + app.directory + ' && git pull && ' + app.cmd;

    logger("Processing...", { app: req.params.appName, cmd });


    const ciProcess = childProcess.exec(cmd);
    ciProcess.stdout.pipe(process.stdout);

    ciProcess.on('exit', function() {
        logger('App process exited');
    });

});

app.listen(config.serverPort, () => {
    logger("Server running!", { port: config.serverPort });
});
