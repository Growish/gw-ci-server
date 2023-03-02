const express = require('express');
const bodyParser = require('body-parser');
const childProcess = require('child_process');
const fastq = require('fastq');

const githubSign = require('./lib/github-sign');
const configManager = require('./lib/config');
const logger = require('./lib/logger');

const config = configManager.load();
const app = express();
app.use(bodyParser.json());

const queues = {};
const allowedTimeout = 60 * 10 * 1000;


app.post('/app/:appName', configManager.mw, githubSign.mw, async (req, res) => {

    res.json({ results: "OK", message: "Done!" });

    logger("Github webhook", { body: req.body });

    const app = req.locals.app;

    const cmd = 'cd ' + app.directory + ' && git pull && ' + app.cmd;

    const appName = req.params.appName;

    if(!queues[appName])
        queues[appName] = fastq.promise(async (data) => {
            //Worker
            logger("Processing...", { app: data.appName, cmd: data.cmd });
            data.startedAt = new Date().getTime();

            const ciProcess = childProcess.exec(data.cmd);
            ciProcess.stdout.pipe(process.stdout);

            data.watchdogTimer = setTimeout(()=> {

                ciProcess.kill();
                logger("The flow has been killed for exceeding the timeout", { app: data.appName, timeout: allowedTimeout })

            }, allowedTimeout);

            ciProcess.on('exit', function(code) {


                clearTimeout(data.watchdogTimer);
                data.endedAt = new Date().getTime();

                logger('App process exited', { code, 'executionTime[ms]': data.endedAt - data.startedAt });

            });

        }, 1);

    logger('Pushing into queue', { app: appName })
    await queues[appName].push({
        appName,
        cmd,
        queuedAt: new Date().getTime(),

    })

});

app.listen(config.serverPort, () => {
    logger("Server running!", { port: config.serverPort });
});
