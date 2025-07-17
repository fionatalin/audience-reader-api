// Campaign lookup endpoint - /api/campaign.js
const snowflake = require('snowflake-sdk');

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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET requests are supported'
    });
  }

  // Get campaign ID from query parameter
  const { campaignId } = req.query;

  if (!campaignId) {
    return res.status(400).json({
      error: 'Missing campaign ID',
      message: 'Campaign ID is required as query parameter: /api/campaign?campaignId=12345'
    });
  }

  let connection;

  try {
    console.log('Creating Snowflake connection...');
    
    // Create Snowflake connection
    connection = snowflake.createConnection({
      account: process.env.SNOWFLAKE_ACCOUNT,
      username: process.env.SNOWFLAKE_USERNAME,
      password: process.env.SNOWFLAKE_PASSWORD,
      warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      database: process.env.SNOWFLAKE_DATABASE,
      schema: process.env.SNOWFLAKE_SCHEMA,
      role: process.env.SNOWFLAKE_ROLE
    });

    // Connect to Snowflake
    await new Promise((resolve, reject) => {
      connection.connect((err, conn) => {
        if (err) {
          console.error('Snowflake connection error:', err);
          reject(err);
        } else {
          console.log('Connected to Snowflake successfully');
          resolve(conn);
        }
      });
    });

    // Query for campaign data
    const query = `
      SELECT 
        template_campaign_id,
        ag_sql_string AS audience_query
      FROM app_engage.app_engage_etl.dim_audience 
      WHERE template_campaign_id = ?
      LIMIT 1
    `;

    console.log('Executing query for campaign:', campaignId);

    const result = await new Promise((resolve, reject) => {
      connection.execute({
        sqlText: query,
        binds: [campaignId],
        complete: (err, stmt, rows) => {
          if (err) {
            console.error('Query execution error:', err);
            reject(err);
          } else {
            console.log('Query executed successfully, rows:', rows?.length || 0);
            resolve(rows);
          }
        }
      });
    });

    if (!result || result.length === 0) {
      return res.status(404).json({
        error: 'Campaign not found',
        message: `No campaign found with ID: ${campaignId}`,
        suggestion: 'Try campaign IDs: 14056393 or 11669940'
      });
    }

    const campaign = result[0];
    
    res.status(200).json({
      success: true,
      campaign_id: campaignId,
      audience_query: campaign.AUDIENCE_QUERY,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Campaign lookup error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString(),
      debug: {
        has_snowflake_config: !!(process.env.SNOWFLAKE_ACCOUNT && process.env.SNOWFLAKE_USERNAME),
        snowflake_account: process.env.SNOWFLAKE_ACCOUNT || 'not_configured'
      }
    });
  } finally {
    // Close connection
    if (connection) {
      try {
        await new Promise((resolve) => {
          connection.destroy((err) => {
            if (err) console.error('Error closing connection:', err);
            resolve();
          });
        });
      } catch (err) {
        console.error('Error during connection cleanup:', err);
      }
    }
  }
};
