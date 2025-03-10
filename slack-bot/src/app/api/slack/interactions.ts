// pages/api/slack/interactions.js - Endpoint for interactive components
import { verifySlackRequest } from '../../../lib/slack/utils';
import { handleInteraction } from '../../../lib/slack/handlers';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  // Verify the request is coming from Slack
  if (!verifySlackRequest(req, process.env.SLACK_SIGNING_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Parse the payload
  const payload = JSON.parse(req.body.payload);
  
  try {
    const response = await handleInteraction(payload);
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error handling interaction:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}