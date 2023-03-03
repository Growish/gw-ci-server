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
const runningProcess = {};
const allowedTimeout = 60 * 10 * 1000;
setInterval(() => {

    let print = false;
    for (const queueName in queues) {

        if (!queues[queueName].idle()) {
            print = true;
            break;
        }
    }

    if(!print)
        return;

    const freeMemory = (os.freemem() / 1024) / 1024;
    const totalMemory = (os.totalmem() / 1024) / 1024;

    logger("System free memory [mb]: ", freeMemory.toFixed(2));

}, 1000);

app.post('/app/:appName', configManager.mw, githubSign.mw, async (req, res) => {

    res.json({results: "OK", message: "Done!"});


    logger("Github webhook", {pusher: req.body.pusher});

    const app = req.locals.app;

    const cmd = 'cd ' + app.directory + ' && git pull && ' + app.cmd;

    const appName = req.params.appName;

    if (!queues[appName])
        queues[appName] = fastq.promise((data) => new Promise((resolve, reject) => {
            //Worker
            logger("Processing...", {app: data.appName, cmd: data.cmd});
            data.startedAt = new Date().getTime();




            try {
                runningProcess[appName] = childProcess.exec(data.cmd);
                runningProcess[appName].stdout.pipe(process.stdout);
            } catch (error) {
                logger("Something went wrong!", {app: data.appName, error});
                return resolve();
            }

            data.watchdogTimer = setTimeout(() => {

                runningProcess[appName].kill();
                logger("The flow has been killed for exceeding the timeout", {
                    app: data.appName,
                    timeout: allowedTimeout
                })
                resolve();

            }, allowedTimeout);

            runningProcess[appName].on('exit', function (code) {


                clearTimeout(data.watchdogTimer);
                data.endedAt = new Date().getTime();
                delete runningProcess[appName];

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

process.on('SIGINT', async () => {

    for(const appName in runningProcess) {
        try {
            runningProcess[appName].kill();
            logger("Running process killed!", { appName });
        }
        catch (error) {
            logger("Cannot kill process", { appName, error });
        }
    }

    process.exit(0);

});
