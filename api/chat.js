// Vercel API endpoint: /api/chat.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  try {
    const { message, context } = req.body;
    
    if (!message) {
      return res.status(400).json({
        error: 'Missing message',
        message: 'Please provide a message'
      });
    }

    console.log('Chat message received:', message);

    // Generate contextual response
    const response = generateChatResponse(message, context);
    
    res.status(200).json({
      response: response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to generate response'
    });
  }
}

function generateChatResponse(message, context) {
  const messageLower = message.toLowerCase();
  
  if (messageLower.includes('count') || messageLower.includes('how many') || messageLower.includes('size') || messageLower.includes('audience size')) {
    return "I can see the targeting criteria, but I don't have access to execute the query to get exact audience counts. To get the current audience size, you can run this query in Snowflake:\n\n```
sql\nSELECT COUNT(*) as audience_size\nFROM (\n  " + (context?.query || "-- Your campaign query here") + "\n) as audience\n
```\n\nThis will give you the exact number of merchants that match the targeting criteria.";
  }
  
  if (messageLower.includes('modify') || messageLower.includes('change') || messageLower.includes('update') || messageLower.includes('edit')) {
    return "To modify this audience, you would typically adjust the SQL query conditions. Here are common modifications:\n\n**Date Ranges:**\n• Change `DATEADD(day,-91,CURRENT_DATE)` to a different number of days\n• Adjust account creation timeframes\n\n**Geographic Targeting:**\n• Add or remove countries from `country_code IN (...)`\n• Include specific regions or states\n\n**Activity Requirements:**\n• Modify merchant segment criteria\n• Adjust payment history requirements\n• Change product usage filters\n\n**Marketing Preferences:**\n• Update consent and communication settings\n• Modify unsubscribe prediction thresholds\n\nWhich specific aspect would you like to change?";
  }
  
  // Default response
  return "That's a great question! I can help explain various aspects of this campaign audience. Here are some things I can help with:\n\n**Audience Analysis:**\n• Audience size and composition\n• Targeting criteria explanation\n• Geographic and demographic breakdown\n\n**Query Modification:**\n• How to adjust targeting parameters\n• Adding or removing criteria\n• Optimizing for different goals\n\n**Performance & Strategy:**\n• Expected campaign performance\n• Best practices for this audience type\n• A/B testing recommendations\n\n**Technical Details:**\n• Data sources and freshness\n• Query optimization\n• Troubleshooting issues\n\nCould you be more specific about what aspect you'd like to explore?";
}
