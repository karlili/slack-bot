# Slack Bot with Socket Mode

This is a Slack bot that handles slash commands using Socket Mode. The bot is built using JavaScript and the Slack Bolt framework.

## Prerequisites

- Node.js installed
- A Slack workspace where you have permissions to add apps
- Slack app created with appropriate permissions

## Setup

1. **Create a Slack App**:

   - Go to [https://api.slack.com/apps](https://api.slack.com/apps)
   - Click "Create New App" and choose "From scratch"
   - Name your app and select your workspace
   - Click "Create App"

2. **Enable Socket Mode**:

   - In your app settings, go to "Socket Mode" in the sidebar
   - Toggle "Enable Socket Mode" to on
   - Generate an app-level token with the `connections:write` scope
   - Save the token as `SLACK_APP_TOKEN` in your `.env` file

3. **Set Up Slash Commands**:

   - Go to "Slash Commands" in the sidebar
   - Click "Create New Command"
   - For each command (e.g., `/hello`, `/weather`), set:
     - Command: The slash command (e.g., `/hello`)
     - Request URL: Can be any URL as it won't be used in Socket Mode
     - Short Description: Brief description of what the command does
     - Usage Hint: Optional hint for arguments
   - Click "Save"

4. **Set Up Bot Token Scopes**:

   - Go to "OAuth & Permissions" in the sidebar
   - Under "Scopes", add the following Bot Token Scopes:
     - `commands` (to handle slash commands)
     - `chat:write` (to send messages)
     - `app_mentions:read` (to read mentions of your app)
     - Add any other scopes needed for your specific functionality

5. **Install the App to Your Workspace**:

   - Go to "Install App" in the sidebar
   - Click "Install to Workspace"
   - Review the permissions and click "Allow"
   - Copy the "Bot User OAuth Token" and save it as `SLACK_BOT_TOKEN` in your `.env` file

6. **Enable Event Subscriptions (Optional for message events)**:
   - Go to "Event Subscriptions" in the sidebar
   - Toggle "Enable Events" to on
   - Under "Subscribe to bot events", add events like:
     - `message.im` (for direct messages)
     - `app_mention` (for mentions)
     - Add any other events needed for your specific functionality

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_APP_TOKEN=xapp-your-app-token
```

## Installation

### JavaScript Implementation
```bash
npm install
```

### Python Implementation
```bash
pip install slack-bolt
pip install python-dotenv
```

## Running the Bot

### JavaScript
```bash
node index.js
```

### Python
```bash
python app.py
```

## Available Commands

### `/hello`
- **JavaScript**: Responds with a greeting and image
- **Python**: Similar functionality with improved image handling

### `/generate`
- Creates a new thread
- Supports text content
- Can upload multiple images in the thread
- Handles file uploads with proper error handling

## Interactive Features

The bot also demonstrates handling button clicks and responding to messages containing "hello".

## Extending the Bot

To add more slash commands, simply add more `app.command()` handlers in `index.js`. For example:

```javascript
app.command('/newcommand', async ({ command, ack, say }) => {
  await ack()
  await say(`Processing your command: ${command.text}`)
})
```

Remember to add the new command in your Slack app settings as well.

## File Structure

```
├── src/
│   ├── index.js          # JavaScript implementation
├── python/
│   ├── app.py           # Python implementation
├── static/
│   ├── images/          # Static images directory
├── .env                 # Environment variables
└── README.md
```

## Image Handling

The bot supports uploading images from the local `static/images` directory. Both implementations include:
- File type validation
- Error handling
- Thread-based responses
- Multiple file upload support

## Error Handling

Both implementations include comprehensive error handling for:
- File operations
- API calls
- Invalid commands
- Missing parameters

## Contributing

Feel free to submit issues and enhancement requests!

## License

[Your chosen license]
