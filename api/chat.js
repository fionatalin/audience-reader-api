// Chat endpoint - /api/chat.js
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only POST requests are supported'
    });
  }

  try {
    const { message, campaign_id } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Missing message',
        message: 'Message is required in request body'
      });
    }

    // For now, return a simple response
    // This can be enhanced with actual AI/LLM integration later
    const response = {
      success: true,
      response: `I received your message: "${message}"${campaign_id ? ` about campaign ${campaign_id}` : ''}. This is a placeholder response. The chat functionality will be enhanced with AI capabilities to explain SQL queries in natural language.`,
      timestamp: new Date().toISOString(),
      campaign_id: campaign_id || null
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
