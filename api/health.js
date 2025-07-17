// Simple test to see if Vercel detects functions at all
module.exports = (req, res) => {
  res.status(200).json({ 
    message: 'Health check working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
};
