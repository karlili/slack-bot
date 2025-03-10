// pages/api/slack/events.js - Endpoint for Slack Events API
import { verifySlackRequest } from '../../../lib/slack/utils';
import { handleSlackEvent } from '../../../lib/slack/handlers';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Verify the request is coming from Slack
  if (!verifySlackRequest(req, process.env.SLACK_SIGNING_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const payload = req.body;
  
  // Handle URL verification challenge from Slack
  if (payload.type === 'url_verification') {
    return res.status(200).json({ challenge: payload.challenge });
  }
  
  // Handle actual events
  if (payload.type === 'event_callback') {
    try {
      await handleSlackEvent(payload.event);
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error handling Slack event:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  // Default response for unhandled event types
  return res.status(200).json({ received: true });
}

// pages/api/slack/commands.js - Endpoint for Slack Commands
import { verifySlackRequest } from '../../../lib/slack/utils';
import { handleSlackCommand } from '../../../lib/slack/handlers';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Verify the request is coming from Slack
  if (!verifySlackRequest(req, process.env.SLACK_SIGNING_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Parse the command data from form-url-encoded format
  const command = req.body;
  
  try {
    const response = await handleSlackCommand(command);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error handling Slack command:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}