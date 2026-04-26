import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, User as UserIcon, LogOut, Shield, Lock, Eye, EyeOff, X, AlertCircle } from 'lucide-react';

/* ── Admin Password Modal ── */
function AdminPasswordModal({ onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input and block body scroll
    setTimeout(() => inputRef.current?.focus(), 50);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const shake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Verify against the stored admin password
    const ADMIN_PASSWORD = 'admin123';
    if (password === ADMIN_PASSWORD) {
      setError('');
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
      shake();
      inputRef.current?.focus();
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '380px', padding: '2.5rem',
          background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(79,70,229,0.3)',
          borderRadius: '20px', boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          position: 'relative',
          animation: shaking ? 'shake 0.5s ease' : 'popIn 0.25s ease',
        }}
      >
        <style>{`
          @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          @keyframes shake {
            0%,100% { transform: translateX(0); }
            20% { transform: translateX(-10px); }
            40% { transform: translateX(10px); }
            60% { transform: translateX(-8px); }
            80% { transform: translateX(8px); }
          }
        `}</style>

        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', padding: '0.3rem' }}
        >
          <X size={18} />
        </button>

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, rgba(79,70,229,0.3), rgba(124,58,237,0.3))',
            border: '2px solid rgba(129,140,248,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield size={28} color="#818cf8" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.3rem' }}>Admin Access</h3>
          <p style={{ color: 'rgba(203,213,225,0.7)', fontSize: '0.875rem' }}>Enter the admin password to continue.</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ position: 'relative', marginBottom: '1rem' }}>
            <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(203,213,225,0.5)', pointerEvents: 'none' }} />
            <input
              ref={inputRef}
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Admin password"
              className="input-field"
              style={{ paddingLeft: '2.75rem', paddingRight: '3rem', borderColor: error ? '#f87171' : undefined }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(203,213,225,0.5)', padding: 0 }}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontSize: '0.82rem', marginBottom: '1rem', padding: '0.6rem 0.9rem', background: 'rgba(248,113,113,0.1)', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.25)' }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button
            type="submit"
            className="btn"
            style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '1rem', background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', marginTop: '0.25rem' }}
          >
            <Shield size={16} /> Unlock Admin Panel
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Navbar ── */
function Navbar({ user, onLogout }) {
  const navigate = useNavigate();
  const [showAdminModal, setShowAdminModal] = useState(false);

  const handleLogout = () => { onLogout(); navigate('/'); };

  const handleAdminSuccess = () => {
    setShowAdminModal(false);
    navigate('/admin');
  };

  return (
    <>
      <nav className="navbar glass">
        <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
          <BookOpen className="text-primary" />
          <span>Lumina<span style={{ color: 'var(--primary)' }}>Lib</span></span>
        </Link>

        <div className="nav-links">
          <Link to="/catalog">Catalog</Link>
          <Link to="/ebooks" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>📚 Ebooks</Link>
          {user ? (
            <>
              {user.role === 'admin' && (
                <button
                  id="navbar-admin-link"
                  onClick={() => setShowAdminModal(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                    color: '#818cf8', fontWeight: 600,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 'inherit', padding: 0,
                  }}
                >
                  <Shield size={16} /> Admin
                </button>
              )}
              <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <UserIcon size={18} /> Dashboard
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary">Login</Link>
              <Link to="/register" className="btn">Register</Link>
            </>
          )}
        </div>
      </nav>

      {showAdminModal && (
        <AdminPasswordModal
          onClose={() => setShowAdminModal(false)}
          onSuccess={handleAdminSuccess}
        />
      )}
    </>
  );
}

export default Navbar;
