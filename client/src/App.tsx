import { useState, useEffect } from 'react';
import './App.css';
import logo from './assets/logo.png';

interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  category: string;
  affiliateUrl: string;
}

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:5001/api/products?category=${category}`);
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [category]);

  const categories = ['All', 'Health', 'Electronics', 'Household', 'E-books'];

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo-container">
          <img src={logo} alt="RonJohns Trendy Things Logo" className="logo" />
          <p className="tagline">your next favorite thing awaits</p>
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
      </header>

      <main className="content">
        <div className="hero">
          <h1>Curated Trends, Delivered to You</h1>
          <p>Discover what's buzzing in Health, Tech, and more.</p>
        </div>

        {loading ? (
          <div className="loader">Finding the latest trends...</div>
        ) : (
          <div className="product-grid">
            {products.length > 0 ? products.map(product => (
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
              <div className="no-products">No trending items found in this category.</div>
            )}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>&copy; 2026 RonJohns Trendy Things. All rights reserved.</p>
        <p>Built for youwantitwegotit.online</p>
      </footer>
    </div>
  );
}

export default App;
