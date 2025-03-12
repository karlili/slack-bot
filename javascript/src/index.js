require('dotenv').config()
require('path')
const { App } = require('@slack/bolt')

// Initialize the Slack app with your tokens
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  // Add this to receive all message events without having to subscribe to them
  ignoreSelf: true,
})

const fs = require('fs');
const path = require('path');

// Handle slash command
app.command('/hello', async ({ command, ack, say, client }) => {
  // Acknowledge command request
  await ack()

  try {
    // First, post a parent message to create a thread
    const parentMessage = await client.chat.postMessage({
      channel: command.channel_id,
      text: `<@${command.user_id}>, hello`,

    });

  } catch (error) {
    console.error('Error uploading image:', error);
    await say(`Hello <@${command.user_id}>! I tried to send you an image, but encountered an error.`);
  }
})

// Handle /generate command that replies in a thread with the provided text
app.command('/generate', async ({ command, ack, client, respond }) => {
  // Acknowledge command request
  await ack()

  try {
    // If no text is provided, respond with a helpful message
    if (!command.text || command.text.trim() === '') {
      await respond({
        text: 'We do not accept empty parameter for the /generate command.',
        response_type: 'ephemeral',
      })
      return
    }

    // Post a message in the channel where the command was invoked
    const result = await client.chat.postMessage({
      channel: command.channel_id,
      text: `<@${command.user_id}> submitted an experiment with the following`,
      // Save the thread_ts to reply in thread
      thread_ts: command.thread_ts || undefined,
    })

    //using the last message, we can post the message as a thread

    const images = await getImages('../static/images')
    // Reply in the thread with the text from the command
    // await postThreads(result, command, client);

    // Also post images in the same thread
    await postImageAsThread(result, command, client, images);

  } catch (error) {
    console.error('Error handling /generate command:', error)
    await respond({
      text: 'An error occurred while processing your command.',
      response_type: 'ephemeral',
    })
  }
})

const postThreads = async (orginialMessage, originalCommand, client) => {
  try {
    await client.chat.postMessage({
      channel: originalCommand.channel_id,
      thread_ts: originalMessage.ts, // Use the timestamp from the first message to create a thread
      text: originalCommand.text, // Use the text provided in the command

      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Generated content:*\n\`\`\`${originalCommand.text}\`\`\``,
          },
        },
      ],
    })
  } catch (error) {
    console.error('Error handling /generate command:', error)
    await respond({
      text: 'An error occurred while processing your command.',
      response_type: 'ephemeral',
    })
  }
}


/**
 * Posts multiple images as replies in a thread
 * @param {Object} originalMessage - The original message to reply to
 * @param {Object} originalCommand - The original command that triggered this
 * @param {Object} client - The Slack client
 * @param {Array<string>} [specificFiles] - Optional array of specific file paths to upload
 * @returns {Promise<void>}
 */
const postImageAsThread = async (originalMessage, originalCommand, client, specificFiles = null) => {
  try {
    // Get files to upload - either use provided files or get all images
    const filesToUpload = specificFiles;

    if (!filesToUpload || filesToUpload.length === 0) {
      console.log('No files to upload');
      return;
    }

    // Create an array of promises for uploading each file
    const uploadPromises = filesToUpload.map(file => {
      return client.files.uploadV2({
        channel_id: originalCommand.channel_id,
        thread_ts: originalMessage.ts, // This puts the file in the thread
        file: fs.createReadStream(file.path),
        filename: file.name,
        title: file.description || `File ${file.name}`
      });
    });

    // Wait for all uploads to complete
    const results = await Promise.all(uploadPromises);
    console.log(`Successfully uploaded ${results.length} files to the thread`);

    return results;
  } catch (error) {
    console.error('Error uploading images to thread:', error);
    // If respond is available in this context
    if (typeof respond === 'function') {
      await respond({
        text: 'An error occurred while uploading images.',
        response_type: 'ephemeral',
      });
    }
  }
}

/**
 * Lists all files in a directory
 * @param {string} directoryPath - The path to the directory to list files from
 * @returns {Promise<Array<{path: string, name: string}>>} - Array of file objects with path and name
 */
const listFilesInDirectory = (directoryPath) => {
  return new Promise((resolve, reject) => {
    fs.readdir(directoryPath, { withFileTypes: true }, (err, files) => {
      if (err) {
        return reject(err);
      }

      // Filter out directories, only return files
      const fileList = files
        .filter(file => file.isFile())
        .map(file => ({
          path: path.join(directoryPath, file.name),
          name: file.name,
          description: `File ${file.name}`
        }));

      resolve(fileList);
    });
  });
}

/**
 * Gets all images from the static/images directory
 * @returns {Promise<Array<{path: string, name: string, description: string}>>} - Array of image file objects
 */
const getImages = async (filepath) => {
  try {
    const imagesDirectory = path.join(__dirname, filepath);
    const files = await listFilesInDirectory(imagesDirectory);

    // You can add additional filtering here if needed
    // For example, to only include certain file types:
    const imageFiles = files.filter(file => {
      const ext = path.extname(file.name).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
    });

    return imageFiles;
  } catch (error) {
    console.error('Error getting images:', error);
    return [];
  }
}

// Example of handling interactive buttons
app.action('button_click', async ({ body, ack, say }) => {
  // Acknowledge the action
  await ack()

  await say(`<@${body.user.id}> clicked the button!`)
})

// Example of handling message events
app.message('hello', async ({ message, say }) => {
  await say(`Hey there <@${message.user}>!`)
})

  // Start the app
  ; (async () => {
    await app.start(process.env.PORT || 3000)
    console.log('⚡️ Slack bot is running!')
  })()
