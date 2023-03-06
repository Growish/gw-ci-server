const {App: SlackBot} = require("@slack/bolt");
const logger = require('./logger');


module.exports = (config) => {

    const slackBot = new SlackBot({
        token: config.botToken,
        signingSecret: config.signingSecret
    });

    class SlackMessage {

        constructor(channel) {
            this.channel = channel;
            this.messageId = null;
            this.messageTitle = null;
            this.messageAppname = null;
            this.messageFrom = null;
        }

        async send(text, blocks) {

            try {
                const response = await slackBot.client.chat.postMessage({
                    channel: this.channel,
                    text,
                    blocks
                });

                this.messageId = response.ts;
            } catch (error) {
                logger("Cannot send slack message", {error});
            }

        }

        async update(text, blocks) {

            if (!this.messageId)
                return;

            await slackBot.client.chat.update({
                ts: this.messageId,
                channel: this.channel,
                text,
                blocks
            });

        }

        async notifyCiFlow(title, appName, from) {

            this.messageTitle = title;
            this.messageAppname = appName;
            this.messageFrom = from;

            return this.send(title, [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "New CI flow queued",
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": "*Application:*\n" + appName
                        },
                        {
                            "type": "mrkdwn",
                            "text": "*Pushed by:*\n" + from
                        }
                    ]
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": "*Status:*\n⏳ Queued"
                        },
                        {
                            "type": "mrkdwn",
                            "text": "*Last update:*\n" + new Date().toUTCString()
                        }
                    ]
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": "*Execution time [s]:*\nN/A"
                        }
                    ]
                }
            ]);

        }

        async updateCiFlow(status, executionTime) {



            return this.update(this.messageTitle, [
                {
                    "type": "header",
                    "text": {
                        "type": "plain_text",
                        "text": "New CI flow queued",
                    }
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": "*Application:*\n" + this.messageAppname
                        },
                        {
                            "type": "mrkdwn",
                            "text": "*Pushed by:*\n" + this.messageFrom
                        }
                    ]
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": "*Status:*\n" + status
                        },
                        {
                            "type": "mrkdwn",
                            "text": "*Last update:*\n" + new Date().toUTCString()
                        }
                    ]
                },
                {
                    "type": "section",
                    "fields": [
                        {
                            "type": "mrkdwn",
                            "text": "*Execution time [s]:*\n" + (executionTime ? parseInt(executionTime/1000) : 'N/A')
                        }
                    ]
                }
            ]);

        }

    }

    return SlackMessage;
};