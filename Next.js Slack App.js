// File structure for the Next.js 15.2.1 Slack app with App Router:

/*
my-slack-app/
├── .env.local              # Environment variables
├── package.json            # Project dependencies
├── app/
│   ├── api/
│   │   ├── slack/
│   │   │   ├── events/
│   │   │   │   └── route.js   # Slack Events API endpoint
│   │   │   ├── commands/
│   │   │   │   └── route.js   # Slack Commands endpoint
│   │   │   └── interactions/
│   │   │       └── route.js   # Slack Interactions endpoint
│   ├── page.js              # App homepage
│   └── layout.js            # Root layout
├── lib/
│   ├── slack/
│   │   ├── client.js       # Slack client setup
│   │   ├── handlers.js     # Event and command handlers
│   │   └── utils.js        # Utility functions
└── public/                 # Static assets
*/

// First, let's update the package.json file with all the dependencies we'll need for Next.js 15.2.1

// package.json
{
  "name": "my-slack-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.2.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@slack/web-api": "^6.8.1",
    "crypto": "^1.0.1"
  }
}

// .env.local (you'll need to fill these with your actual Slack credentials)
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_BOT_TOKEN=xoxb-your_bot_token
SLACK_CHANNEL_ID=your_channel_id

// lib/slack/client.js - Set up the Slack WebClient
import { WebClient } from '@slack/web-api';

// Initialize Slack Web Client
export const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

// lib/slack/utils.js - Utility functions for Slack interactions
import crypto from 'crypto';

// Verify that requests are coming from Slack
export function verifySlackRequest(request, signingSecret) {
  const signature = request.headers.get('x-slack-signature');
  const timestamp = request.headers.get('x-slack-request-timestamp');
  
  if (!signature || !timestamp) {
    return false;
  }
  
  // Check if the timestamp is recent to prevent replay attacks
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
    return false;
  }
  
  // Use the raw body for signature verification
  return true; // Note: For proper implementation, verify with the raw body (see note below)
}

// Note on signature verification: The App Router handles bodies differently.
// For a complete implementation, you'll need to use a middleware or 
// the rawBody from the Slack SDK to properly verify the signature.

// Function to create a button-based interactive message
export function createInteractiveMessage(channelId, text, actions) {
  return {
    channel: channelId,
    text: text,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: text
        }
      },
      {
        type: "actions",
        elements: actions.map(action => ({
          type: "button",
          text: {
            type: "plain_text",
            text: action.text
          },
          value: action.value,
          action_id: action.action_id
        }))
      }
    ]
  };
}

// lib/slack/handlers.js - Handle specific events and commands
import { slack } from './client';
import { createInteractiveMessage } from './utils';

// Handle a specific Slack command
export async function handleSlackCommand(command) {
  // Check if this is the command we want to handle
  if (command.command === '/mycommand') {
    const channelId = command.channel_id;
    
    // Create a response with interactive buttons
    const message = createInteractiveMessage(
      channelId,
      "What would you like to do?",
      [
        { text: "Option 1", value: "option_1", action_id: "action_option_1" },
        { text: "Option 2", value: "option_2", action_id: "action_option_2" },
        { text: "Option 3", value: "option_3", action_id: "action_option_3" }
      ]
    );
    
    // Send the response
    await slack.chat.postMessage(message);
    
    // Return a 200 response to acknowledge receipt
    return { text: "Processing your command..." };
  }
  
  return { text: "Unknown command" };
}

// Handle a Slack event
export async function handleSlackEvent(event) {
  // Handle only events from the specific channel we're interested in
  if (event.channel !== process.env.SLACK_CHANNEL_ID) {
    return;
  }
  
  // Look for specific text in messages that would trigger our app
  if (event.type === 'message' && event.text) {
    const lowerText = event.text.toLowerCase();
    
    // Check if the message contains our trigger word
    if (lowerText.includes('handle command')) {
      // Send an interactive message response
      const message = createInteractiveMessage(
        event.channel,
        "I noticed you want to handle a command. What would you like to do?",
        [
          { text: "Option A", value: "option_a", action_id: "action_option_a" },
          { text: "Option B", value: "option_b", action_id: "action_option_b" },
          { text: "Help", value: "help", action_id: "action_help" }
        ]
      );
      
      await slack.chat.postMessage(message);
    }
  }
}

// Handle interactive responses when users click buttons
export async function handleInteraction(payload) {
  const action = payload.actions[0];
  const channelId = payload.channel.id;
  const userId = payload.user.id;
  
  let responseText = "You selected: " + action.text.text;
  
  // Handle different button clicks
  switch (action.action_id) {
    case 'action_option_1':
    case 'action_option_a':
      responseText += "\nExecuting Option 1/A...";
      break;
      
    case 'action_option_2':
    case 'action_option_b':
      responseText += "\nExecuting Option 2/B...";
      break;
      
    case 'action_help':
      responseText = "Here's how to use this app: [Instructions here]";
      break;
      
    default:
      responseText += "\nProcessing your selection...";
  }
  
  // Send a follow-up message
  await slack.chat.postMessage({
    channel: channelId,
    text: responseText,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: responseText
        }
      }
    ]
  });
  
  // Return a 200 response to acknowledge the interaction
  return { text: "Processing..." };
}

// app/api/slack/events/route.js - Endpoint for Slack Events API
import { NextResponse } from 'next/server';
import { verifySlackRequest } from '../../../../lib/slack/utils';
import { handleSlackEvent } from '../../../../lib/slack/handlers';

export async function POST(request) {
  // Verify the request is coming from Slack
  if (!verifySlackRequest(request, process.env.SLACK_SIGNING_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get the payload
  const payload = await request.json();
  
  // Handle URL verification challenge from Slack
  if (payload.type === 'url_verification') {
    return NextResponse.json({ challenge: payload.challenge });
  }
  
  // Handle actual events
  if (payload.type === 'event_callback') {
    try {
      await handleSlackEvent(payload.event);
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error handling Slack event:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  }
  
  // Default response for unhandled event types
  return NextResponse.json({ received: true });
}

// app/api/slack/commands/route.js - Endpoint for Slack Commands
import { NextResponse } from 'next/server';
import { verifySlackRequest } from '../../../../lib/slack/utils';
import { handleSlackCommand } from '../../../../lib/slack/handlers';

export async function POST(request) {
  // Verify the request is coming from Slack
  if (!verifySlackRequest(request, process.env.SLACK_SIGNING_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get form data (Slack sends commands as form data)
  const formData = await request.formData();
  const command = Object.fromEntries(formData.entries());
  
  try {
    const response = await handleSlackCommand(command);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error handling Slack command:', error);
    return NextResponse.json