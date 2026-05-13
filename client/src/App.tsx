import { useState, useEffect } from 'react';
import './App.css';
import logo from './assets/logo.png';

interface Product {
  id: string;
  title: string;
  price: string;
  priceValue: number;
  image: string;
  category: string;
  affiliateUrl: string;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || '';
        const response = await fetch(`${apiUrl}/api/products?category=${category}`);
        if (!response.ok) throw new Error('Failed to reach the server.');
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError("We're having trouble reaching the trend engine. Please try again in a moment.");
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [category]);

  const categories = ['All', 'Health', 'Electronics', 'Household', 'E-books'];

  const filteredAndSortedProducts = products
    .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price-low') {
        return a.priceValue - b.priceValue;
      }
      if (sortBy === 'price-high') {
        return b.priceValue - a.priceValue;
      }
      return 0;
    });

  return (
    <div className="app-container">
      <div id="logo-header-bar">
        <div className="logo-wrapper">
          <div className="brand-text">
            <h1 className="brand-name">RonJohns</h1>
            <h2 className="brand-subtitle">TRENDY THINGS</h2>
            <p className="brand-tagline">Your Next Favorite Thing Awaits</p>
          </div>
        </div>
      </div>
      
      <header className="header">
        <div className="header-actions">
          <div className="search-bar">
            <input 
              type="text" 
              placeholder="Search trends..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <nav className="nav">
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`nav-item ${category === cat ? 'active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="content">
        <div className="controls">
          <div className="results-count">
            {filteredAndSortedProducts.length} items found
          </div>
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="default">Sort by: Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>

        {loading ? (
          <div className="loader">Finding the latest trends...</div>
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
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" required />
              <button type="submit">Join Now</button>
            </form>
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
