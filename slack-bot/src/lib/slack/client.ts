import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Slack Web Client
export const slack = new WebClient(process.env.SLACK_BOT_TOKEN);