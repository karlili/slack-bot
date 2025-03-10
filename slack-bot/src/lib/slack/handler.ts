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