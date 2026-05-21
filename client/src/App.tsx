import { useState, useEffect } from 'react';
import './App.css';
import ronProfile from './assets/ron-profile.jpg';

interface Product {
  id: string;
  title: string;
  price: string;
  priceValue: number;
  image: string;
  category: string;
  affiliateUrl: string;
  source: string;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [email, setEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [hasOptedIn, setHasOptedIn] = useState(() => {
    return localStorage.getItem('hasOptedIn') === 'true';
  });

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribeStatus({ type: null, message: '' });

    try {
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        setSubscribeStatus({ type: 'success', message: 'You are in! Check your inbox for trends.' });
        setEmail('');
        // Transition to store after a short delay to show success message
        setTimeout(() => {
          setHasOptedIn(true);
          localStorage.setItem('hasOptedIn', 'true');
        }, 2000);
      } else {
        setSubscribeStatus({ type: 'error', message: data.error || 'Something went wrong.' });
        // Clear error after 5 seconds
        setTimeout(() => setSubscribeStatus({ type: null, message: '' }), 5000);
      }
    } catch {
      setSubscribeStatus({ type: 'error', message: 'Could not connect to the mail server.' });
      // Clear error after 5 seconds
      setTimeout(() => setSubscribeStatus({ type: null, message: '' }), 5000);
    }
  };

  const handleSkip = () => {
    setHasOptedIn(true);
    localStorage.setItem('hasOptedIn', 'true');
  };

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/products?category=${encodeURIComponent(category)}`);
        if (!response.ok) throw new Error('Failed to load trends');
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [category]);

  const categories = [
    'All', 
    'Health & Wellness', 
    'Electronics/Gadgets', 
    'Household Goods', 
    'Furniture/Lawn & Garden', 
    'Toys', 
    'Mens Apparel', 
    'Womens Apparel',
    'Shade'
  ];

  const filteredAndSortedProducts = products
    .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-low') return a.priceValue - b.priceValue;
      if (sortBy === 'price-high') return b.priceValue - a.priceValue;
      return 0;
    });

  if (!hasOptedIn) {
    return (
      <div className="optin-page">
        <div className="optin-card">
          <div className="optin-image">
            <img src={ronProfile} alt="Ron" />
          </div>
          <div className="optin-content">
            <h1 className="brand-name">RonJohns</h1>
            <h2 className="brand-subtitle">TRENDY THINGS</h2>
            <p className="catchphrase">"Your Next Favorite Thing Awaits"</p>
            
            <div className="story-section">
              <p>
                Hi, I'm Ron. With over 30 years dedicated to customer service and as a proud US Army Veteran, 
                I know the value of trust, quality, and finding exactly what you need.
              </p>
              <p>
                I built <strong>RonJohns Trendy Things</strong> to cut through the noise and curate the best, 
                most innovative products out there. Join my newsletter to get my top picks sent straight to your inbox.
              </p>
            </div>

            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit">Show Me The Trends</button>
            </form>
            
            {subscribeStatus.type && (
              <p className={`subscribe-status ${subscribeStatus.type}`}>
                {subscribeStatus.message}
              </p>
            )}

            <button className="skip-button" onClick={handleSkip}>
              Skip to Store
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div id="logo-header-bar">
        <div className="brand-text">
          <h1 className="brand-name">RonJohns</h1>
          <h2 className="brand-subtitle">TRENDY THINGS</h2>
          <p className="brand-tagline">"Your Next Favorite Thing Awaits"</p>
        </div>
      </div>

      <nav className="category-nav">
        {categories.map(cat => (
          <button 
            key={cat} 
            className={category === cat ? 'active' : ''}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      <div className="filters-bar">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search trends..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="sort-box">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="default">Sort: Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      <main className="content">
        {loading ? (
          <div className="loading-state">Scouring the web for the latest trends...</div>
        ) : error ? (
          <div className="error-state">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredAndSortedProducts.length > 0 ? filteredAndSortedProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  <img src={product.image} alt={product.title} />
                </div>
                <div className="product-info">
                  <span className="category-tag">{product.category}</span>
                  <h3>{product.title}</h3>
                  <p className="price">{product.price}</p>
                  <a href={product.affiliateUrl} target="_blank" rel="noopener noreferrer" className="buy-button">
                    Check Price & Buy
                  </a>
                </div>
              </div>
            )) : (
              <div className="no-products">No trending items found matching your criteria.</div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <div className="footer-content">
          <div className="newsletter">
            <h4>Stay Ahead of the Trends</h4>
            <p>Get curated weekly updates on the latest buzzing products.</p>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit">Join Now</button>
            </form>
            {subscribeStatus.type && (
              <p className={`subscribe-status ${subscribeStatus.type}`}>
                {subscribeStatus.message}
              </p>
            )}
          </div>
          <p className="disclosure">
            <strong>Affiliate Disclosure:</strong> As an affiliate, we may earn a commission from qualifying purchases made through links on this site. This helps us keep the trends coming at no extra cost to you.
          </p>
          <div className="footer-bottom">
            <p>&copy; 2026 RonJohns Trendy Things. All rights reserved.</p>
            <p>Built for youwantitwegotit.online</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
