require('dotenv').config();
const { App } = require('@slack/bolt');

// Initialize the Slack app with your tokens
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  // Add this to receive all message events without having to subscribe to them
  ignoreSelf: true
});

// Handle slash command
app.command('/hello', async ({ command, ack, say }) => {
  // Acknowledge command request
  await ack();

  // Respond to the command
  await say(`Hello <@${command.user_id}>! You said: ${command.text}`);
});

// Example of handling a second slash command
app.command('/weather', async ({ command, ack, respond }) => {
  // Acknowledge command request
  await ack();

  // Respond to the command
  await respond({
    text: `Weather forecast for ${command.text || 'your location'}: ☀️ Sunny!`,
    response_type: 'ephemeral' // Only visible to the user who invoked the command
  });
});

// Handle /generate command that replies in a thread with the provided text
app.command('/generate', async ({ command, ack, client, respond }) => {
  // Acknowledge command request
  await ack();

  try {
    // If no text is provided, respond with a helpful message
    if (!command.text || command.text.trim() === '') {
      await respond({
        text: 'We do not accept empty parameter for the /generate command.',
        response_type: 'ephemeral'
      });
      return;
    }

    // Post a message in the channel where the command was invoked
    const result = await client.chat.postMessage({
      channel: command.channel_id,
      text: `<@${command.user_id}> submitted an experiment with the following`,
      // Save the thread_ts to reply in thread
      thread_ts: command.thread_ts || undefined
    });

    // Reply in the thread with the text from the command
    await client.chat.postMessage({
      channel: command.channel_id,
      thread_ts: result.ts, // Use the timestamp from the first message to create a thread
      text: command.text, // Use the text provided in the command
      // Optional: You can add formatting or additional context here
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Generated content:*\n\`\`\`${command.text}\`\`\``
          }
        }
      ]
    });

    // Provide feedback to the user that the command was successful
    // if (!command.thread_ts) {
    //   await respond({
    //     text: 'Your message has been posted in a new thread!',
    //     response_type: 'ephemeral'
    //   });
    // }
  } catch (error) {
    console.error('Error handling /generate command:', error);
    await respond({
      text: 'An error occurred while processing your command.',
      response_type: 'ephemeral'
    });
  }
});

// Example of handling interactive buttons
app.action('button_click', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack();

  await say(`<@${body.user.id}> clicked the button!`);
});

// Example of handling message events
app.message('hello', async ({ message, say }) => {
  await say(`Hey there <@${message.user}>!`);
});

// Start the app
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Slack bot is running!');
})();
