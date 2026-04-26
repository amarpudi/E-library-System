import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';

function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="hero">
      <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Discover Your Next Great Read
      </h1>
      <p>
        Welcome to LuminaLib, your premium digital library. Explore thousands of e-books, journals, and resources available instantly from anywhere.
      </p>
      
      <form onSubmit={handleSearch} className="search-bar glass" style={{ padding: '0.5rem', borderRadius: '12px' }}>
        <input 
          type="text" 
          className="input-field" 
          placeholder="Search by title, author, or genre..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ border: 'none', background: 'transparent' }}
        />
        <button type="submit" className="btn" style={{ padding: '0.8rem 1.5rem' }}>
          <Search size={20} /> Search
        </button>
      </form>
    </div>
  );
}

export default Home;
