import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import Dashboard from './pages/Dashboard';
import Reader from './pages/Reader';
import AdminPanel from './pages/AdminPanel';
import Ebooks from './pages/Ebooks';
import EbookReader from './pages/EbookReader';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData.user);
    localStorage.setItem('user', JSON.stringify(userData.user));
    localStorage.setItem('token', userData.token);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <Router>
      <div className="app-container">
        <Navbar user={user} onLogout={handleLogout} />
        <main className="container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog user={user} />} />
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <Navigate to="/login" />} />
            <Route path="/reader/:bookId" element={user ? <Reader /> : <Navigate to="/login" />} />
            <Route path="/admin" element={user?.role === 'admin' ? <AdminPanel user={user} /> : <Navigate to="/login" />} />
            <Route path="/ebooks" element={<Ebooks />} />
            <Route path="/ebooks/:id" element={<EbookReader />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
