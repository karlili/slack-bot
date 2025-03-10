import React from 'react';

export default function Home() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Slack Integration App</h1>
      <p>This app integrates with Slack to listen for events and respond with interactive messages.</p>
      <h2>Features:</h2>
      <ul>
        <li>Listens for specific commands in a Slack channel</li>
        <li>Responds with interactive buttons</li>
        <li>Processes button clicks and provides follow-up actions</li>
      </ul>
      <p>Status: Application is running and ready to receive Slack events.</p>
    </div>
  );
}