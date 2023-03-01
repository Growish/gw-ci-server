const express = require('express');
const bodyParser = require('body-parser');
const childProcess = require('child_process');


const githubSign = require('./lib/github-sign');
const configManager = require('./lib/config');
const logger = require('./lib/logger');

const config = configManager.load();
const app = express();
app.use(bodyParser.json());

const runningProcess = {};

app.post('/app/:appName', configManager.mw, githubSign.mw, async (req, res) => {

    res.json({ results: "OK", message: "Done!" });

    const app = req.locals.app;

    const cmd = 'cd ' + app.directory + ' && git pull && ' + app.cmd;

    const appName = req.params.appName;

    logger("Processing...", { app: appName, cmd });

    if(runningProcess[appName] && runningProcess[appName].running)
        return logger("Cannot created a new flow since one is already running", { app: appName, startedAt: runningProcess[appName].startedAt  });

    runningProcess[appName] = {
        running: true,
        startedAt: new Date().getTime()
    };

    const ciProcess = childProcess.exec(cmd);
    ciProcess.stdout.pipe(process.stdout);


    ciProcess.on('exit', function(code) {

        runningProcess[appName].running = false;
        runningProcess[appName].endedAt = new Date().getTime();

        logger('App process exited', { code, 'executionTime[ms]': runningProcess[appName].endedAt - runningProcess[appName].startedAt });

    });

});

app.listen(config.serverPort, () => {
    logger("Server running!", { port: config.serverPort });
});
