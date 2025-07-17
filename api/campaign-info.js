// Simple campaign info endpoint - /api/campaign-info.js
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
  }

  // Return environment variable debug info
  res.status(200).json({
    message: 'Campaign endpoint debug info',
    timestamp: new Date().toISOString(),
    environment_check: {
      has_snowflake_account: !!process.env.SNOWFLAKE_ACCOUNT,
      has_snowflake_username: !!process.env.SNOWFLAKE_USERNAME,
      has_snowflake_password: !!process.env.SNOWFLAKE_PASSWORD,
      snowflake_account: process.env.SNOWFLAKE_ACCOUNT || 'NOT_SET',
      snowflake_username: process.env.SNOWFLAKE_USERNAME || 'NOT_SET',
      snowflake_warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'NOT_SET',
      snowflake_database: process.env.SNOWFLAKE_DATABASE || 'NOT_SET',
      snowflake_schema: process.env.SNOWFLAKE_SCHEMA || 'NOT_SET',
      snowflake_role: process.env.SNOWFLAKE_ROLE || 'NOT_SET'
    },
    test_campaigns: ['14056393', '11669940'],
    usage: 'Use /api/campaign?campaignId=14056393 to test actual campaign lookup'
  });
};
