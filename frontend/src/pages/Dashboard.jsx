import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, RotateCcw, Loader2, BookMarked, Clock,
  CheckCircle, User, Tag, ExternalLink, Shield
} from 'lucide-react';

function Dashboard({ user }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returning, setReturning] = useState(null);
  const [toast, setToast] = useState(null);
  const navigate = useNavigate();

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDashboard = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/users/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch { setRecords([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const handleReturn = async (recordId, title) => {
    setReturning(recordId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_API_URL}/api/transactions/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ recordId })
      });
      if (res.ok) { showToast(`"${title}" returned successfully!`); fetchDashboard(); }
      else { const d = await res.json(); showToast(d.error || 'Failed to return', 'error'); }
    } catch { showToast('Network error', 'error'); }
    finally { setReturning(null); }
  };

  const active = records.filter(r => !r.returnDate);
  const history = records.filter(r => r.returnDate);

  return (
    <div>
      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .record-card { display: flex; gap: 1.5rem; padding: 1.2rem 1.5rem; border-radius: 16px; background: rgba(30,41,59,0.7); border: 1px solid var(--glass-border); transition: border-color .2s; }
        .record-card:hover { border-color: rgba(79,70,229,0.4); }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999,
          padding: '.9rem 1.4rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '.75rem',
          background: toast.type === 'error' ? 'rgba(248,113,113,.12)' : 'rgba(74,222,128,.12)',
          border: `1px solid ${toast.type === 'error' ? '#f87171' : '#4ade80'}`,
          boxShadow: '0 8px 32px rgba(0,0,0,.4)', animation: 'slideUp .3s ease',
        }}>
          {toast.type === 'error' ? <span style={{ color: '#f87171' }}>✕</span> : <CheckCircle size={18} color="#4ade80" />}
          <span style={{ fontSize: '.9rem' }}>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '.5rem' }}>
          <h2 style={{ fontSize: '2rem', background: 'linear-gradient(to right,#818cf8,#c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Welcome, {user?.username}
          </h2>
          {user?.role === 'admin' && (
            <span style={{ fontSize: '.75rem', padding: '.2rem .7rem', borderRadius: '10px', background: 'rgba(129,140,248,.2)', color: '#818cf8', border: '1px solid rgba(129,140,248,.3)', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
              <Shield size={12} /> Admin
            </span>
          )}
        </div>
        <p style={{ color: 'var(--text-muted)' }}>Manage your borrowed books and reading history.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
        {[
          { icon: <BookOpen size={22} color="#818cf8" />, label: 'Currently Reading', value: active.length, color: '#818cf8' },
          { icon: <CheckCircle size={22} color="#4ade80" />, label: 'Books Returned', value: history.length, color: '#4ade80' },
          { icon: <BookMarked size={22} color="#c084fc" />, label: 'Total Borrowed', value: records.length, color: '#c084fc' },
        ].map((s, i) => (
          <div key={i} className="glass" style={{ padding: '1.2rem 1.5rem', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${s.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={36} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : records.length === 0 ? (
        <div className="glass" style={{ padding: '3rem', borderRadius: '16px', textAlign: 'center' }}>
          <BookMarked size={52} style={{ marginBottom: '1rem', opacity: .3 }} />
          <p style={{ fontSize: '1.1rem', marginBottom: '.5rem' }}>No borrowed books yet</p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Browse the catalog or World Catalog to borrow your first book.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/catalog" className="btn" style={{ textDecoration: 'none' }}><BookOpen size={16} /> Browse Catalog</Link>
            <Link to="/catalog?tab=world" className="btn btn-secondary" style={{ textDecoration: 'none' }}>🌍 World Catalog</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Currently Reading */}
          {active.length > 0 && (
            <section style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <Clock size={18} color="#fbbf24" /> Currently Reading <span style={{ fontSize: '.8rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '.3rem' }}>({active.length})</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                {active.map(record => (
                  <BookRecord key={record.id} record={record} onReturn={handleReturn} onRead={() => navigate(`/reader/${record.BookId}`)} returning={returning === record.id} />
                ))}
              </div>
            </section>
          )}

          {/* History */}
          {history.length > 0 && (
            <section>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                <CheckCircle size={18} color="#4ade80" /> Reading History <span style={{ fontSize: '.8rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: '.3rem' }}>({history.length})</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.85rem' }}>
                {history.map(record => (
                  <BookRecord key={record.id} record={record} returned onRead={() => navigate(`/reader/${record.BookId}`)} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function BookRecord({ record, onReturn, onRead, returning, returned }) {
  const book = record.Book || {};
  const cover = book.coverImage;
  const pdfUrl = book.pdfUrl;
  const canRead = pdfUrl && pdfUrl !== '#';

  return (
    <div className="record-card">
      {/* Cover */}
      <div style={{ flexShrink: 0 }}>
        {cover
          ? <img src={cover} alt={book.title} style={{ width: '70px', height: '100px', objectFit: 'cover', borderRadius: '10px' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
          : null}
        <div style={{ width: '70px', height: '100px', borderRadius: '10px', background: 'linear-gradient(135deg,rgba(79,70,229,.4),rgba(192,132,252,.3))', display: cover ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookOpen size={28} color="#818cf8" />
        </div>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h4 style={{ fontWeight: 700, marginBottom: '.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{book.title || 'Unknown'}</h4>
        <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', marginBottom: '.5rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
          <User size={12} /> {book.author || '—'}
        </p>
        {book.genre && (
          <span style={{ fontSize: '.72rem', padding: '.15rem .55rem', borderRadius: '8px', background: 'rgba(79,70,229,.15)', color: '#818cf8', display: 'inline-flex', alignItems: 'center', gap: '.3rem', marginBottom: '.5rem' }}>
            <Tag size={10} /> {book.genre}
          </span>
        )}
        <div style={{ display: 'flex', gap: '1rem', fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.3rem', flexWrap: 'wrap' }}>
          <span>📅 Borrowed: {new Date(record.borrowDate).toLocaleDateString()}</span>
          {record.returnDate && <span>✅ Returned: {new Date(record.returnDate).toLocaleDateString()}</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', flexShrink: 0, justifyContent: 'center' }}>
        {!returned && (
          <>
            {canRead ? (
              <button className="btn" onClick={onRead} style={{ whiteSpace: 'nowrap', fontSize: '.85rem', padding: '.55rem 1rem', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)' }}>
                <BookOpen size={15} /> Read Now
              </button>
            ) : (
              <a href={pdfUrl || '#'} target="_blank" rel="noopener noreferrer" className="btn btn-secondary"
                style={{ whiteSpace: 'nowrap', fontSize: '.85rem', padding: '.55rem 1rem', textDecoration: 'none' }}>
                <ExternalLink size={15} /> Open Link
              </a>
            )}
            <button className="btn btn-secondary" onClick={() => onReturn(record.id, book.title)}
              disabled={returning} style={{ whiteSpace: 'nowrap', fontSize: '.85rem', padding: '.55rem 1rem', opacity: returning ? .6 : 1 }}>
              {returning ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <RotateCcw size={15} />}
              {returning ? 'Returning...' : 'Return'}
            </button>
          </>
        )}
        {returned && canRead && (
          <button className="btn btn-secondary" onClick={onRead} style={{ whiteSpace: 'nowrap', fontSize: '.85rem', padding: '.55rem 1rem' }}>
            <BookOpen size={15} /> Read Again
          </button>
        )}
        <span style={{ fontSize: '.72rem', textAlign: 'center', padding: '.2rem .5rem', borderRadius: '8px', background: returned ? 'rgba(74,222,128,.1)' : 'rgba(251,191,36,.1)', color: returned ? '#4ade80' : '#fbbf24' }}>
          {returned ? '✓ Returned' : '● Reading'}
        </span>
      </div>
    </div>
  );
}

export default Dashboard;
