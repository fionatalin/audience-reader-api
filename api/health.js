// Health check endpoint
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
  }

  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'audience-reader-api',
      version: '1.0.0',
      environment: {
        node_version: process.version,
        has_snowflake_config: !!(process.env.SNOWFLAKE_ACCOUNT && process.env.SNOWFLAKE_USERNAME),
        snowflake_account: process.env.SNOWFLAKE_ACCOUNT || 'not_configured',
        snowflake_username: process.env.SNOWFLAKE_USERNAME || 'not_configured',
        snowflake_warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'not_configured',
        snowflake_database: process.env.SNOWFLAKE_DATABASE || 'not_configured'
      }
    };

    console.log('Health check successful:', health);
    res.status(200).json(health);

  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
