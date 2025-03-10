import crypto from 'crypto';
import { timingSafeEqual } from 'crypto';

// Verify that requests are coming from Slack
export function verifySlackRequest(request, signingSecret) {
  const signature = request.headers['x-slack-signature'];
  const timestamp = request.headers['x-slack-request-timestamp'];
  
  // Check if the timestamp is recent to prevent replay attacks
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - timestamp) > 300) {
    return false;
  }
  
  const body = JSON.stringify(request.body);
  
  const sigBasestring = `v0:${timestamp}:${body}`;
  const mySignature = 'v0=' + 
    crypto
      .createHmac('sha256', signingSecret)
      .update(sigBasestring)
      .digest('hex');
  
  try {
    return timingSafeEqual(
      Buffer.from(mySignature, 'utf8'),
      Buffer.from(signature, 'utf8')
    );
  } catch (e) {
    return false;
  }
}

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