const express = require('express');
const bodyParser = require('body-parser');
const childProcess = require('child_process');
const fastq = require('fastq');
const os = require("os");


const githubSign = require('./lib/github-sign');
const configManager = require('./lib/config');
const logger = require('./lib/logger');

const config = configManager.load();
const app = express();
app.use(bodyParser.json());

const queues = {};
const allowedTimeout = 60 * 10 * 1000;

app.post('/app/:appName', configManager.mw, githubSign.mw, async (req, res) => {

    res.json({results: "OK", message: "Done!"});

    const freeMemory = (os.freemem() / 1024) / 1024;
    const totalMemory = (os.totalmem() / 1024) / 1024;

    logger("Github webhook", {pusher: req.body.pusher, freeMemory, totalMemory });

    const app = req.locals.app;

    const cmd = 'cd ' + app.directory + ' && git pull && ' + app.cmd;

    const appName = req.params.appName;

    if (!queues[appName])
        queues[appName] = fastq.promise((data) => new Promise((resolve, reject) => {
            //Worker
            logger("Processing...", {app: data.appName, cmd: data.cmd});
            data.startedAt = new Date().getTime();

            let ciProcess;

            try {
                ciProcess = childProcess.exec(data.cmd);
                ciProcess.stdout.pipe(process.stdout);
            }
            catch (error) {
                logger("Something went wrong!", { app: data.appName, error });
                return resolve();
            }

            data.watchdogTimer = setTimeout(() => {

                ciProcess.kill();
                logger("The flow has been killed for exceeding the timeout", {
                    app: data.appName,
                    timeout: allowedTimeout
                })
                resolve();

            }, allowedTimeout);

            ciProcess.on('exit', function (code) {


                clearTimeout(data.watchdogTimer);
                data.endedAt = new Date().getTime();

                logger('App process exited', {code, 'executionTime[ms]': data.endedAt - data.startedAt});

                resolve();
            });

        }), 1);

    logger('Pushing into queue', {app: appName})
    await queues[appName].push({
        appName,
        cmd,
        queuedAt: new Date().getTime()
    });

});

app.listen(config.serverPort, () => {
    logger("Server running!", {port: config.serverPort});
});
