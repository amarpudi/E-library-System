import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Trash2, BookMarked, Shield, CheckCircle, AlertCircle, X } from 'lucide-react';

const EMPTY_FORM = {
  title: '',
  author: '',
  genre: '',
  description: '',
  coverImage: '',
  pdfUrl: '',
};

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = type === 'success'
    ? { bg: 'rgba(74,222,128,0.15)', border: '#4ade80', icon: <CheckCircle size={18} color="#4ade80" /> }
    : { bg: 'rgba(248,113,113,0.15)', border: '#f87171', icon: <AlertCircle size={18} color="#f87171" /> };

  return (
    <div style={{
      position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '1rem 1.5rem', borderRadius: '12px',
      background: colors.bg, border: `1px solid ${colors.border}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      animation: 'slideUp 0.3s ease',
      maxWidth: '380px',
    }}>
      {colors.icon}
      <span style={{ flex: 1, fontSize: '0.95rem' }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
        <X size={16} />
      </button>
    </div>
  );
}

function AdminPanel({ user }) {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [booksLoading, setBooksLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // Redirect non-admins
  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/');
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    setBooksLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/books`);
      const data = await res.json();
      setBooks(data);
    } catch {
      showToast('Failed to load books', 'error');
    } finally {
      setBooksLoading(false);
    }
  };

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.author.trim()) {
      showToast('Title and Author are required.', 'error');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast(`"${data.title}" added to the library!`, 'success');
      setForm(EMPTY_FORM);
      fetchBooks();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    setDeleteId(id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/books/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showToast(`"${title}" removed.`, 'success');
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        .admin-grid { display: grid; grid-template-columns: 1fr 1.4fr; gap: 2rem; }
        @media (max-width: 800px) { .admin-grid { grid-template-columns: 1fr; } }
        .book-row { display: flex; align-items: center; gap: 1rem; padding: 0.9rem 1.2rem;
          border-radius: 10px; border: 1px solid var(--glass-border);
          background: rgba(15,23,42,0.5); transition: background 0.2s; }
        .book-row:hover { background: rgba(79,70,229,0.08); }
        .delete-btn { background: none; border: none; cursor: pointer; color: #f87171;
          opacity: 0.6; transition: opacity 0.2s; padding: 0.3rem; border-radius: 6px; }
        .delete-btn:hover { opacity: 1; background: rgba(248,113,113,0.1); }
        .admin-badge { display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600;
          background: rgba(79,70,229,0.2); color: #818cf8; border: 1px solid rgba(79,70,229,0.3);
          margin-bottom: 2rem; }
        .section-title { font-size: 1.1rem; font-weight: 700; margin-bottom: 1.2rem;
          padding-bottom: 0.7rem; border-bottom: 1px solid var(--glass-border);
          display: flex; align-items: center; gap: 0.5rem; }
        .cover-preview { width: 42px; height: 58px; object-fit: cover; border-radius: 5px;
          background: rgba(79,70,229,0.15); flex-shrink: 0; }
        .cover-placeholder { width: 42px; height: 58px; border-radius: 5px; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(79,70,229,0.3), rgba(192,132,252,0.3));
          display: flex; align-items: center; justify-content: center; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div className="admin-badge"><Shield size={14} /> Admin Panel</div>
        <h2 style={{ fontSize: '2.2rem', background: 'linear-gradient(to right, #818cf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.5rem' }}>
          Library Management
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>Add new books and manage the existing catalog.</p>
      </div>

      <div className="admin-grid">
        {/* ── Add Book Form ─────────────────────────────── */}
        <div className="glass" style={{ padding: '2rem', alignSelf: 'start' }}>
          <div className="section-title"><PlusCircle size={18} color="#818cf8" /> Add New Book</div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'Title *', name: 'title', placeholder: 'e.g. The Great Gatsby', required: true },
              { label: 'Author *', name: 'author', placeholder: 'e.g. F. Scott Fitzgerald', required: true },
              { label: 'Genre', name: 'genre', placeholder: 'e.g. Classic, Fiction, Sci-Fi' },
              { label: 'Cover Image URL', name: 'coverImage', placeholder: 'https://...' },
              { label: 'PDF / Resource URL', name: 'pdfUrl', placeholder: 'https://...' },
            ].map(({ label, name, placeholder, required }) => (
              <div className="form-group" key={name} style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</label>
                <input
                  id={`admin-${name}`}
                  className="input-field"
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  required={required}
                />
              </div>
            ))}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Description</label>
              <textarea
                id="admin-description"
                className="input-field"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Brief synopsis of the book..."
                rows={4}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button
              id="admin-submit-btn"
              type="submit"
              className="btn"
              disabled={loading}
              style={{ marginTop: '0.5rem', padding: '0.8rem', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
            >
              <PlusCircle size={18} />
              {loading ? 'Adding Book...' : 'Add Book to Library'}
            </button>
          </form>
        </div>

        {/* ── Book List ─────────────────────────────── */}
        <div className="glass" style={{ padding: '2rem' }}>
          <div className="section-title">
            <BookMarked size={18} color="#818cf8" />
            All Books
            <span style={{ marginLeft: 'auto', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              {books.length} total
            </span>
          </div>

          {booksLoading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading catalog...</p>
          ) : books.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No books yet. Add one!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', maxHeight: '70vh', overflowY: 'auto', paddingRight: '0.3rem' }}>
              {books.map((book) => (
                <div key={book.id} className="book-row">
                  {book.coverImage ? (
                    <img src={book.coverImage} alt={book.title} className="cover-preview" onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <div className="cover-placeholder"><BookMarked size={18} color="#818cf8" /></div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {book.title}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{book.author}</div>
                    {book.genre && (
                      <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '10px', background: 'rgba(79,70,229,0.15)', color: '#818cf8', marginTop: '0.25rem', display: 'inline-block' }}>
                        {book.genre}
                      </span>
                    )}
                  </div>

                  <span style={{
                    fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '8px', flexShrink: 0,
                    background: book.available ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)',
                    color: book.available ? '#4ade80' : '#fbbf24',
                  }}>
                    {book.available ? 'Available' : 'Borrowed'}
                  </span>

                  <button
                    id={`delete-book-${book.id}`}
                    className="delete-btn"
                    onClick={() => handleDelete(book.id, book.title)}
                    disabled={deleteId === book.id}
                    title="Delete book"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default AdminPanel;
