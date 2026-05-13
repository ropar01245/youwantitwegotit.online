const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Startup Validation
const requiredEnv = ['EBAY_API_KEY', 'EBAY_API_SECRET', 'EBAY_CAMPAIGN_ID'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  console.warn('\x1b[33m%s\x1b[0m', `WARNING: Missing eBay API credentials: ${missingEnv.join(', ')}`);
  console.warn('\x1b[33m%s\x1b[0m', 'Live eBay fetching will be disabled.');
}

app.use(cors());
app.use(express.json());

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
  if (missingEnv.length > 0) return [];

  const token = await getEbayToken();
  if (!token) return [];

  // Map our categories to eBay search queries
  const queryMap = {
    'All': 'trending gadgets 2026',
    'Health': 'health beauty wellness',
    'Electronics': 'tech gadgets electronics',
    'Household': 'smart home kitchen appliances',
    'E-books': 'best seller ebooks'
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
  console.log(`Refreshing feed for: ${category}`);
  
  const allManual = getManualProducts();
  const manual = category === 'All' ? allManual : allManual.filter(p => p.category === category);
  
  let live = await fetchEbayProducts(category);

  // Combine and shuffle slightly
  return [...manual, ...live].sort(() => Math.random() - 0.5);
}

app.get('/api/products', async (req, res) => {
  const { category = 'All' } = req.query;
  const now = Date.now();
  
  // Category-specific cache check (15 mins)
  const cached = categoryCache[category];
  if (cached && (now - cached.lastUpdated < 900000)) {
    return res.json(cached.data);
  }

  try {
    const data = await fetchTrendingProducts(category);
    categoryCache[category] = {
      lastUpdated: now,
      data: data
    };
    res.json(data);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Hybrid Mode: Manual JSON + eBay API active.`);
});

