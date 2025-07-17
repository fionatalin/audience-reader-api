// Vercel API endpoint: /api/campaign/[campaignId].js
const snowflake = require('snowflake-sdk');

// Snowflake configuration
const snowflakeConfig = {
  account: process.env.SNOWFLAKE_ACCOUNT || 'square',
  username: process.env.SNOWFLAKE_USERNAME || 'fiona',
  password: process.env.SNOWFLAKE_PASSWORD,
  warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'ADHOC__MEDIUM',
  database: process.env.SNOWFLAKE_DATABASE || 'app_engage',
  schema: process.env.SNOWFLAKE_SCHEMA || 'app_engage_etl',
  role: process.env.SNOWFLAKE_ROLE || 'PUBLIC'
};

// Execute Snowflake query
function executeQuery(connection, sqlText, binds = []) {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sqlText,
      binds: binds,
      complete: function(err, stmt, rows) {
        if (err) {
          console.error('Snowflake query error:', err.message);
          reject(err);
        } else {
          console.log(`Query executed successfully. Rows returned: ${rows.length}`);
          resolve(rows);
        }
      }
    });
  });
}

// Generate explanation from SQL query
function generateExplanation(sqlQuery) {
  const conditions = [];
  const queryLower = sqlQuery.toLowerCase();

  if (queryLower.includes('country_code')) {
    const countryMatch = sqlQuery.match(/country_code\s+in\s*\(['"]([^'"]+)['"][^)]*\)/i);
    if (countryMatch) {
      const countries = countryMatch[1].split(',').map(c => c.trim().replace(/['"]/g, ''));
      conditions.push(`**Geographic Targeting**: ${countries.join(', ')}`);
    }
  }

  if (queryLower.includes('preferred_language_code')) {
    conditions.push('**Language**: English-speaking merchants');
  }

  if (queryLower.includes('latest_card_payment_date')) {
    if (queryLower.includes('91')) {
      conditions.push('**Recent Activity**: Processed payments in the last 91 days');
    } else if (queryLower.includes('30')) {
      conditions.push('**Recent Activity**: Processed payments in the last 30 days');
    } else {
      conditions.push('**Recent Activity**: Recently processed payments');
    }
  }

  if (queryLower.includes('first_successful_activation_request_created_at_date')) {
    if (queryLower.includes('30')) {
      conditions.push('**Account Maturity**: Established accounts (created at least 30 days ago)');
    } else {
      conditions.push('**Account Maturity**: Established accounts');
    }
  }

  if (queryLower.includes('include_marketing = 1')) {
    conditions.push('**Marketing Consent**: Opted in to receive marketing communications');
  }

  if (queryLower.includes('community_username_primary is not null')) {
    conditions.push('**Community Engagement**: Active community members with usernames');
  }

  if (queryLower.includes('num_currently_frozen_units = 0')) {
    conditions.push('**Account Status**: Not frozen or suspended');
  }

  if (queryLower.includes('num_currently_deactivated_units = 0')) {
    conditions.push('**Account Status**: Not deactivated');
  }

  if (queryLower.includes("merchant_segment != 'inactive'")) {
    conditions.push('**Business Activity**: Active merchants (not inactive)');
  }

  if (queryLower.includes('unsub_prediction')) {
    conditions.push('**Email Engagement**: Low probability of unsubscribing');
  }

  if (queryLower.includes('last_use_square_point_of_sale')) {
    conditions.push('**Product Usage**: Recently used Square Point of Sale');
  }

  if (queryLower.includes('business_type_grouping')) {
    conditions.push('**Business Type**: Specific industry categories');
  }

  let explanation = "## Campaign Target Audience\n\n";
  explanation += "This campaign targets Square sellers who meet the following criteria:\n\n";
  
  if (conditions.length > 0) {
    explanation += conditions.map(condition => `• ${condition}`).join('\n');
  } else {
    explanation += "• Meet specific business criteria defined in the SQL query";
  }

  explanation += "\n\n## Business Rationale\n\n";
  explanation += "These targeting criteria are designed to:\n";
  explanation += "• Reach engaged, active merchants most likely to respond positively\n";
  explanation += "• Respect merchant communication preferences and consent\n";
  explanation += "• Focus on merchants with established, healthy business relationships\n";
  explanation += "• Optimize campaign performance and ROI\n\n";
  explanation += "*This audience is regularly updated based on the latest merchant data and activity.*";

  return explanation;
}

// Main API handler
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

  const { campaignId } = req.query;
  
  if (!campaignId) {
    return res.status(400).json({
      error: 'Missing campaign ID',
      message: 'Please provide a campaign ID'
    });
  }

  console.log(`Looking up campaign ID: ${campaignId}`);

  let connection;
  
  try {
    connection = snowflake.createConnection(snowflakeConfig);
    
    await new Promise((resolve, reject) => {
      connection.connect((err, conn) => {
        if (err) {
          console.error('Snowflake connection error:', err.message);
          reject(err);
        } else {
          console.log('Successfully connected to Snowflake');
          resolve(conn);
        }
      });
    });

    const query = `
      SELECT ag_sql_string AS audience_query, 
             template_campaign_id, 
             campaign_id,
             ag_list_name as list_name,
             ag_created_at as created_at,
             ag_submitted_by as submitted_by
      FROM app_engage.app_engage_etl.dim_audience
      WHERE campaign_id = ?
      LIMIT 1
    `;
    
    console.log('Executing Snowflake query...');
    const results = await executeQuery(connection, query, [campaignId]);
    
    if (results.length === 0) {
      return res.status(404).json({
        error: 'Campaign not found',
        message: `No audience query found for campaign ID: ${campaignId}. Please verify the campaign ID exists.`
      });
    }

    const campaignData = results[0];
    console.log('Campaign data retrieved successfully');
    
    const explanation = generateExplanation(campaignData.AUDIENCE_QUERY);
    
    res.status(200).json({
      campaign_id: campaignData.CAMPAIGN_ID,
      template_campaign_id: campaignData.TEMPLATE_CAMPAIGN_ID,
      list_name: campaignData.LIST_NAME,
      query: campaignData.AUDIENCE_QUERY,
      explanation: explanation,
      metadata: {
        created_at: campaignData.CREATED_AT,
        submitted_by: campaignData.SUBMITTED_BY
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    
    if (error.message.includes('authentication')) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Unable to authenticate with Snowflake. Please check credentials.'
      });
    }
    
    if (error.message.includes('warehouse')) {
      return res.status(503).json({
        error: 'Warehouse unavailable',
        message: 'Snowflake warehouse is not available. Please try again later.'
      });
    }
    
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch campaign data. Please try again.'
    });
    
  } finally {
    if (connection) {
      try {
        connection.destroy();
        console.log('Snowflake connection closed');
      } catch (err) {
        console.error('Error closing connection:', err);
      }
    }
  }
}
