const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse body
  let email;
  if (req.body) {
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        email = parsed.email;
      } catch(e) {
         return res.status(400).json({ error: 'Invalid JSON body' });
      }
    } else {
      email = req.body.email;
    }
  }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const apiKey = process.env.SENDSHARK_API_KEY || '62f98cfdbc3476742b577d3953ce2e9f619687747b7d2e7f2d2757bef7c458d2';
  const campaignId = process.env.SENDSHARK_CAMPAIGN_ID || 'XcX1OdbC5sEf';

  if (!apiKey || !campaignId) {
    console.error('SendShark configuration missing');
    return res.status(500).json({ error: 'Mailing list configuration is incomplete.' });
  }

  try {
    // SendShark API call
    await axios.post('https://www.sendshark.com/api/v1/subscribers', {
      api_key: apiKey,
      campaign_id: campaignId,
      email: email
    });

    res.status(200).json({ message: 'Successfully subscribed!' });
  } catch (error) {
    console.error('SendShark Subscription Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to subscribe. Please try again later.' });
  }
};