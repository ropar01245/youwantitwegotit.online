const axios = require('axios');
const fs = require('fs');
const path = require('path');

const MANUAL_PRODUCTS_PATH = path.join(__dirname, 'manual_products.json');

// Category-specific cache
let categoryCache = {};

/**
 * eBay OAuth: Gets an access token using Client ID and Secret
 */
async function getEbayToken() {
  const auth = Buffer.from(`${process.env.EBAY_API_KEY}:${process.env.EBAY_API_SECRET}`).toString('base64');
  try {
    const response = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', 
      'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope', 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        }
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching eBay token:', error.response?.data || error.message);
    return null;
  }
}

/**
 * eBay Browse API: Fetches real products from eBay
 */
async function fetchEbayProducts(category) {
  if (!process.env.EBAY_API_KEY || !process.env.EBAY_API_SECRET || !process.env.EBAY_CAMPAIGN_ID) return [];

  const token = await getEbayToken();
  if (!token) return [];

  // Map our categories to eBay search queries
  const queryMap = {
    'All': 'trending gadgets 2026',
    'Health & Wellness': 'health beauty wellness',
    'Electronics/Gadgets': 'tech gadgets electronics',
    'Household Goods': 'smart home kitchen appliances',
    'Furniture/Lawn & Garden': 'furniture garden patio decor',
    'Toys': 'toys games collectibles',
    'Mens Apparel': 'mens clothing fashion accessories',
    'Womens Apparel': 'womens clothing fashion accessories',
    'Shade': 'sunglasses patio shades window treatments',
    'E-books': 'best seller ebooks fiction non-fiction'
  };

  const query = queryMap[category] || 'trending';
  
  try {
    const response = await axios.get(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}&limit=12`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-ENDUSERCTX': `affiliateCampaignId=${process.env.EBAY_CAMPAIGN_ID}`
      }
    });

    return (response.data.itemSummaries || []).map(item => ({
      id: item.itemId,
      title: item.title,
      price: `${item.price.currency} ${item.price.value}`,
      priceValue: parseFloat(item.price.value),
      image: item.image?.imageUrl || 'https://via.placeholder.com/400',
      category: category === 'All' ? 'Electronics' : category,
      affiliateUrl: item.itemAffiliateWebUrl || item.itemWebUrl,
      source: 'ebay'
    }));
  } catch (error) {
    console.error(`Error fetching eBay products for ${category}:`, error.response?.data || error.message);
    return [];
  }
}

/**
 * Manual System: Reads the JSON file for Amazon/ClickBank products
 */
function getManualProducts() {
  try {
    if (fs.existsSync(MANUAL_PRODUCTS_PATH)) {
      const raw = fs.readFileSync(MANUAL_PRODUCTS_PATH);
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Error reading manual products:', error);
  }
  return [];
}

async function fetchTrendingProducts(category = 'All') {
  const allManual = getManualProducts();
  const manual = category === 'All' ? allManual : allManual.filter(p => p.category === category);
  
  let live = await fetchEbayProducts(category);

  // Combine and shuffle slightly
  return [...manual, ...live].sort(() => Math.random() - 0.5);
}

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

  const { category = 'All' } = req.query;
  const now = Date.now();
  
  // Category-specific cache check (15 mins)
  const cached = categoryCache[category];
  if (cached && (now - cached.lastUpdated < 900000)) {
    return res.status(200).json(cached.data);
  }

  try {
    const data = await fetchTrendingProducts(category);
    categoryCache[category] = {
      lastUpdated: now,
      data: data
    };
    res.status(200).json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

