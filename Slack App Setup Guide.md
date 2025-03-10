# Setting Up Your Slack Integration App with Next.js 15.2.1

This guide will walk you through the process of setting up your Next.js 15.2.1 app with App Router that listens for Slack events and responds with interactive messages.

## Prerequisites

- Node.js (v18 or newer, recommended for Next.js 15.2.1)
- A Slack workspace where you have admin privileges
- ngrok or similar tool for exposing local development server (during development)

## Step 1: Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps) and click "Create New App"
2. Choose "From scratch"
3. Name your app and select your workspace
4. Click "Create App"

## Step 2: Configure Slack App Permissions

Navigate to "OAuth & Permissions" in the sidebar and add the following Bot Token Scopes:

- `channels:history` - To read messages in channels
- `chat:write` - To send messages
- `commands` - To create slash commands
- `reactions:write` - (Optional) To add reactions

Click "Install to Workspace" and authorize the app in your workspace. Note the Bot User OAuth Token that starts with `xoxb-`.

## Step 3: Set Up Event Subscriptions

1. Navigate to "Event Subscriptions" in the sidebar and turn on "Enable Events"
2. In the "Request URL" field, enter your app's endpoint URL: `https://your-domain.com/api/slack/events`
   - During development, you can use ngrok: `https://your-ngrok-url.ngrok.io/api/slack/events`
   - Slack will immediately verify this endpoint by sending a challenge request

3. Under "Subscribe to bot events" add:
   - `message.channels` - To receive channel messages

4. Save your changes

## Step 4: Create Slash Commands (Optional)

1. Navigate to "Slash Commands" in the sidebar and click "Create New Command"
2. Enter the following:
   - Command: `/mycommand`
   - Request URL: `https://your-domain.com/api/slack/commands`
   - Short Description: "Trigger interactive actions"
   - Usage Hint: "[optional text]"
3. Save your command

## Step 5: Set Up Interactive Components

1. Navigate to "Interactivity & Shortcuts" in the sidebar
2. Turn on "Interactivity"
3. Set the Request URL to `https://your-domain.com/api/slack/interactions`
4. Save your changes

## Step 6: Create and Configure the App

1. Create a new Next.js app with the App Router:
   ```
   npx create-next-app@latest my-slack-app
   ```
   When prompted, select:
   - Would you like to use TypeScript? (choose your preference)
   - Would you like to use ESLint? Yes
   - Would you like to use Tailwind CSS? (choose your preference)
   - Would you like to use `src/` directory? No
   - Would you like to use App Router? Yes
   - Would you like to customize the default import alias? No

2. Create a `.env.local` file with the following variables:
   ```
   SLACK_SIGNING_SECRET=your_slack_signing_secret
   SLACK_BOT_TOKEN=xoxb-your_bot_token
   SLACK_CHANNEL_ID=your_channel_id
   ```
   - Find your Signing Secret in "Basic Information" under "App Credentials"
   - The Bot Token is the OAuth token noted earlier
   - You can get the Channel ID from Slack by right-clicking the channel and selecting "Copy Link" - the ID is in the URL

3. Install Slack-related dependencies:
   ```
   npm install @slack/web-api
   ```

4. Add the files from the provided code structure

5. Start the development server:
   ```
   npm run dev
   ```

## Step 7: Expose Your Local Server (Development)

If you're developing locally, use ngrok to expose your server:

```
ngrok http 3000
```

Use the generated URL to update your Slack app's request URLs.

## Step 8: Add the App to Your Channel

1. In your Slack workspace, go to the channel you want to monitor
2. Invite your bot with `/invite @your-app-name`

## Step 9: Testing

1. Post a message containing "handle command" in your specified channel
2. Your app should respond with interactive buttons
3. Test the slash command by typing `/mycommand` in the channel

## Step 10: Deploy to Production

Deploy your Next.js app to a platform like Vercel, Netlify, or your own server. Update your Slack app's request URLs with your production domain.

## Troubleshooting

- **URL verification fails**: Make sure your endpoint correctly responds to the challenge parameter
- **Events not received**: Check that your bot is invited to the channel and has the necessary permissions
- **Authentication errors**: Verify your environment variables are set correctly

## Next Steps

Once your basic app is working, you can extend its functionality:
- Add more complex interactive components (menus, date pickers)
- Implement persistent storage for user preferences or history
- Add more sophisticated command parsing
- Integrate with other services

Remember to monitor your app logs for any errors and adjust as needed.
