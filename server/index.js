const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// In-memory cache to prevent hitting APIs too hard
let productCache = {
  lastUpdated: null,
  data: []
};

const CATEGORIES = ['Health', 'Electronics', 'Household', 'E-books'];

/**
 * Automation Logic: Fetching from multiple sources
 * In a real scenario, you'd use:
 * - Amazon PA-API for Electronics/Household
 * - eBay Browse API for Electronics/Trending
 * - ClickBank API for E-books/Health
 */
async function fetchTrendingProducts() {
  console.log('Automating product fetch...');
  
  // Logic for switching between MOCK and LIVE data based on ENV presence
  const hasKeys = process.env.AMAZON_API_KEY && process.env.EBAY_API_KEY;

  if (!hasKeys) {
    console.log('No API keys found. Operating in MOCKED automation mode.');
    return [
      { id: 'a1', title: 'Sonic Vibration Toothbrush', price: '$34.99', image: 'https://images.unsplash.com/photo-1559594806-03f47e62093e?auto=format&fit=crop&w=400&q=80', category: 'Health', affiliateUrl: 'https://amazon.com' },
      { id: 'e1', title: 'Noise Cancelling Wireless Buds', price: '$89.00', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=400&q=80', category: 'Electronics', affiliateUrl: 'https://amazon.com' },
      { id: 'h1', title: 'Smart LED Ambient Light Bar', price: '$45.50', image: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=400&q=80', category: 'Household', affiliateUrl: 'https://amazon.com' },
      { id: 'b1', title: 'The 2026 Guide to Digital Nomadism', price: '$12.99', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80', category: 'E-books', affiliateUrl: 'https://clickbank.com' },
      { id: 'a2', title: 'Weighted Deep Sleep Mask', price: '$22.00', image: 'https://images.unsplash.com/photo-1517404212738-15263e9f9178?auto=format&fit=crop&w=400&q=80', category: 'Health', affiliateUrl: 'https://amazon.com' },
    ];
  }

  // Real logic would go here:
  // const amazonData = await fetchAmazonTrending();
  // const ebayData = await fetchEbayTrending();
  // return [...amazonData, ...ebayData];
  return []; 
}

app.get('/api/products', async (req, res) => {
  const { category } = req.query;
  
  // Update cache if empty or older than 1 hour
  if (!productCache.lastUpdated || (Date.now() - productCache.lastUpdated > 3600000)) {
    productCache.data = await fetchTrendingProducts();
    productCache.lastUpdated = Date.now();
  }

  let filtered = productCache.data;
  if (category && category !== 'All') {
    filtered = productCache.data.filter(p => p.category === category);
  }

  res.json(filtered);
});

app.listen(PORT, () => {
  console.log(`Automation server running on port ${PORT}`);
  console.log(`Primary Domain: youwantitwegotit.online`);
});
