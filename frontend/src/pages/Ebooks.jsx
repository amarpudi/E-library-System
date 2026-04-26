import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Loader2, ChevronLeft, ChevronRight, User, BookMarked } from 'lucide-react';

const GUTENDEX = 'https://gutendex.com/books';

const TOPICS = [
  { label: '🏆 Popular', q: '' },
  { label: '📖 Fiction', q: 'fiction' },
  { label: '🔬 Science', q: 'science' },
  { label: '🏛️ History', q: 'history' },
  { label: '💕 Romance', q: 'love' },
  { label: '🔮 Fantasy', q: 'fantasy' },
  { label: '🕵️ Mystery', q: 'detective' },
  { label: '🧠 Philosophy', q: 'philosophy' },
  { label: '🚀 Adventure', q: 'adventure' },
  { label: '👻 Horror', q: 'horror' },
  { label: '🌍 Travel', q: 'travel' },
  { label: '🎭 Drama', q: 'drama' },
];

function getCover(book) {
  return book.formats?.['image/jpeg'] || null;
}

function getReadUrl(book) {
  return (
    book.formats?.['text/html'] ||
    book.formats?.['text/html; charset=utf-8'] ||
    book.formats?.['text/plain'] ||
    book.formats?.['text/plain; charset=utf-8'] ||
    null
  );
}

function Spin() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
      <Loader2 size={36} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
    </div>
  );
}

function BookCard({ book, onClick }) {
  const cover = getCover(book);
  const canRead = !!getReadUrl(book);
  const subjects = book.subjects?.slice(0, 2).map(s => s.split('--')[0].trim()) || [];

  return (
    <div className="book-card glass" style={{ cursor: 'pointer' }} onClick={onClick}>
      {cover
        ? <img src={cover} alt={book.title} className="book-cover"
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
        : null}
      <div className="book-cover" style={{
        display: cover ? 'none' : 'flex', flexDirection: 'column', gap: '.5rem',
        background: 'linear-gradient(135deg,rgba(79,70,229,.5),rgba(192,132,252,.4))',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <BookOpen size={44} color="#818cf8" />
        <span style={{ fontSize: '.7rem', color: '#c084fc', textAlign: 'center', padding: '0 .5rem' }}>Project Gutenberg</span>
      </div>

      <div className="book-info">
        <h3 className="book-title" style={{ fontSize: '.95rem', lineHeight: 1.3 }}>{book.title}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', color: 'var(--text-muted)', fontSize: '.82rem', marginBottom: '.5rem' }}>
          <User size={12} />{book.authors?.map(a => a.name).join(', ') || 'Unknown'}
        </div>

        {subjects.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem', marginBottom: '.7rem' }}>
            {subjects.map((s, i) => (
              <span key={i} style={{ fontSize: '.68rem', padding: '.1rem .45rem', borderRadius: '8px', background: 'rgba(79,70,229,.15)', color: '#818cf8' }}>{s}</span>
            ))}
          </div>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '.75rem', color: book.download_count > 1000 ? '#4ade80' : 'var(--text-muted)' }}>
            ↓ {book.download_count?.toLocaleString()} downloads
          </span>
          <span style={{
            fontSize: '.72rem', padding: '.15rem .55rem', borderRadius: '8px',
            background: canRead ? 'rgba(74,222,128,.15)' : 'rgba(251,191,36,.15)',
            color: canRead ? '#4ade80' : '#fbbf24',
          }}>
            {canRead ? '📖 Readable' : '📄 Download only'}
          </span>
        </div>

        <button className="btn" style={{ width: '100%', justifyContent: 'center', marginTop: '.8rem', fontSize: '.85rem' }}>
          <BookOpen size={15} /> {canRead ? 'Read Now' : 'View Book'}
        </button>
      </div>
    </div>
  );
}

export default function Ebooks() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const load = useCallback(async (url) => {
    setLoading(true); setBooks([]);
    try {
      const r = await fetch(url);
      const d = await r.json();
      setBooks(d.results || []);
      setNextUrl(d.next || null);
      setPrevUrl(d.previous || null);
      setTotal(d.count || 0);
    } catch { setBooks([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('languages', 'en');
    if (searchQuery) params.set('search', searchQuery);
    else if (topic.q) params.set('topic', topic.q);
    else params.set('sort', 'popular');
    setPage(1);
    load(GUTENDEX + '?' + params.toString());
  }, [searchQuery, topic, load]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = input.trim();
    setSearchQuery(q);
    if (q) setTopic(TOPICS[0]);
  };

  const handleTopic = (t) => {
    setTopic(t);
    setSearchQuery('');
    setInput('');
  };

  const goNext = () => { if (nextUrl) { load(nextUrl); setPage(p => p + 1); window.scrollTo(0, 0); } };
  const goPrev = () => { if (prevUrl) { load(prevUrl); setPage(p => p - 1); window.scrollTo(0, 0); } };

  const openBook = (book) => {
    navigate(`/ebooks/${book.id}`);
  };

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2.2rem', background: 'linear-gradient(to right,#4ade80,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '.4rem' }}>
          📚 Ebooks Library
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          70,000+ free ebooks from Project Gutenberg — classics, fiction, science & more. Read directly in your browser.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="search-bar glass" style={{ padding: '.4rem', borderRadius: '12px', marginBottom: '1.2rem', maxWidth: '650px' }}>
        <input id="ebook-search-input" type="text" className="input-field"
          placeholder="Search ebooks by title or author..."
          value={input} onChange={e => setInput(e.target.value)}
          style={{ border: 'none', background: 'transparent' }} />
        <button type="submit" className="btn" style={{ padding: '.7rem 1.4rem' }}><Search size={18} /> Search</button>
      </form>

      {/* Topic pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem', marginBottom: '1.8rem' }}>
        {TOPICS.map(t => (
          <button key={t.label} onClick={() => handleTopic(t)}
            className={topic.label === t.label && !searchQuery ? 'btn' : 'btn btn-secondary'}
            style={{ padding: '.3rem .9rem', fontSize: '.82rem', borderRadius: '20px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Meta */}
      {!loading && total > 0 && (
        <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', marginBottom: '1.5rem' }}>
          {searchQuery
            ? <>Found <strong style={{ color: 'var(--text-main)' }}>{total.toLocaleString()}</strong> results for "<em>{searchQuery}</em>"</>
            : <><strong style={{ color: 'var(--text-main)' }}>{total.toLocaleString()}</strong> ebooks in {topic.label}</>
          } — Page <strong style={{ color: 'var(--text-main)' }}>{page}</strong>
        </p>
      )}

      {/* Grid */}
      {loading ? <Spin /> : books.length === 0
        ? <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            <BookMarked size={48} style={{ opacity: .4, marginBottom: '1rem' }} />
            <p>No ebooks found. Try a different search.</p>
          </div>
        : <div className="book-grid">{books.map(b => <BookCard key={b.id} book={b} onClick={() => openBook(b)} />)}</div>
      }

      {/* Pagination */}
      {(prevUrl || nextUrl) && !loading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2.5rem' }}>
          <button className="btn btn-secondary" onClick={goPrev} disabled={!prevUrl} style={{ opacity: prevUrl ? 1 : .4 }}>
            <ChevronLeft size={18} /> Prev
          </button>
          <span style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>Page <strong style={{ color: 'var(--text-main)' }}>{page}</strong></span>
          <button className="btn btn-secondary" onClick={goNext} disabled={!nextUrl} style={{ opacity: nextUrl ? 1 : .4 }}>
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
