import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, BookOpen, ExternalLink, Loader2,
  BookMarked, Globe, FileText
} from 'lucide-react';

const OL = 'https://openlibrary.org';

/* Try to find a freely readable Internet Archive identifier for a book */
async function findReadableEdition(olKey) {
  try {
    // Get editions for this work
    const r = await fetch(`${OL}${olKey}/editions.json?limit=20`);
    if (!r.ok) return null;
    const data = await r.json();
    const editions = data.entries || [];

    for (const ed of editions) {
      const iaId = ed.ocaid || (ed.source_records || []).find(s => s.startsWith('ia:'))?.replace('ia:', '');
      if (iaId) {
        // Check if publicly readable on IA
        const avail = await fetch(`https://archive.org/services/borrow/api?action=availability&identifier=${iaId}`);
        if (avail.ok) {
          return iaId;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

/* Extract OL work key from a pdfUrl like https://openlibrary.org/works/OL123W */
function extractOLKey(pdfUrl) {
  if (!pdfUrl) return null;
  const m = pdfUrl.match(/(\/works\/OL\w+)/);
  return m ? m[1] : null;
}

/* Search Gutenberg for the book */
function gutenbergUrl(title, author) {
  return `https://www.gutenberg.org/ebooks/search/?query=${encodeURIComponent(title + ' ' + author)}`;
}

function googleBooksUrl(title, author) {
  return `https://www.google.com/search?q=${encodeURIComponent(title + ' ' + author + ' read online free')}`;
}

function openLibraryReadUrl(pdfUrl) {
  if (pdfUrl && pdfUrl.startsWith('http') && pdfUrl !== '#') return pdfUrl;
  return null;
}

/* ── Spinner ── */
function Spin({ label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem', color: 'var(--text-muted)' }}>
      <Loader2 size={40} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      <p style={{ fontSize: '0.95rem' }}>{label || 'Loading...'}</p>
    </div>
  );
}

/* ── Fallback card with external links ── */
function FallbackReader({ book }) {
  const olReadUrl = openLibraryReadUrl(book.pdfUrl);

  const links = [
    olReadUrl && { label: 'Read on Open Library', url: olReadUrl, icon: <BookOpen size={18} />, color: '#c084fc' },
    { label: 'Search on Project Gutenberg', url: gutenbergUrl(book.title, book.author), icon: <FileText size={18} />, color: '#4ade80' },
    { label: 'Search on Open Library', url: `${OL}/search?q=${encodeURIComponent(book.title)}`, icon: <BookMarked size={18} />, color: '#818cf8' },
    { label: 'Find Free Online Version', url: googleBooksUrl(book.title, book.author), icon: <Globe size={18} />, color: '#60a5fa' },
  ].filter(Boolean);

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      {/* Book card */}
      <div className="glass" style={{ display: 'flex', gap: '2rem', padding: '2rem', borderRadius: '20px', marginBottom: '2rem', alignItems: 'flex-start' }}>
        {book.coverImage
          ? <img src={book.coverImage} alt={book.title} style={{ width: '120px', height: '180px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }} />
          : <div style={{ width: '120px', height: '180px', borderRadius: '12px', flexShrink: 0, background: 'linear-gradient(135deg,rgba(79,70,229,.4),rgba(192,132,252,.3))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={48} color="#818cf8" />
            </div>
        }
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{book.title}</h3>
          <p style={{ color: 'var(--primary)', marginBottom: '0.8rem', fontWeight: 500 }}>by {book.author}</p>
          {book.genre && <span style={{ fontSize: '0.8rem', padding: '0.2rem 0.7rem', borderRadius: '10px', background: 'rgba(79,70,229,.15)', color: '#818cf8' }}>{book.genre}</span>}
          {book.description && (
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
              {book.description.slice(0, 400)}{book.description.length > 400 ? '...' : ''}
            </p>
          )}
        </div>
      </div>

      {/* Read online options */}
      <div className="glass" style={{ padding: '1.5rem 2rem', borderRadius: '20px' }}>
        <h4 style={{ marginBottom: '1.2rem', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Read Online
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {links.map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: '1rem',
                padding: '1rem 1.25rem', borderRadius: '12px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)',
                textDecoration: 'none', color: 'var(--text-main)',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(79,70,229,0.1)'; e.currentTarget.style.borderColor = 'rgba(79,70,229,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
            >
              <span style={{ color: l.color }}>{l.icon}</span>
              <span style={{ flex: 1, fontWeight: 500 }}>{l.label}</span>
              <ExternalLink size={15} style={{ color: 'var(--text-muted)' }} />
            </a>
          ))}
        </div>
        <p style={{ marginTop: '1.2rem', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Many classic books are freely available on Project Gutenberg and Open Library.
        </p>
      </div>
    </div>
  );
}

/* ── Embedded IA Reader ── */
function EmbedReader({ iaId, book, onFallback }) {
  const [loaded, setLoaded] = useState(false);
  const embedUrl = `https://archive.org/embed/${iaId}?ui=embed#page/1/mode/2up`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {!loaded && <Spin label="Loading book reader..." />}
      <iframe
        src={embedUrl}
        title={`Reading: ${book.title}`}
        style={{ flex: 1, border: 'none', borderRadius: '12px', minHeight: '75vh', display: loaded ? 'block' : 'none' }}
        allowFullScreen
        onLoad={() => setLoaded(true)}
        onError={onFallback}
      />
      <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
        Powered by <a href="https://archive.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Internet Archive</a>
      </p>
    </div>
  );
}

/* ── Main Reader ── */
function Reader() {
  const { bookId } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [iaId, setIaId] = useState(null);
  const [searching, setSearching] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/api/books/${bookId}`)
      .then(r => r.json())
      .then(async (data) => {
        setBook(data);
        // Try to find a readable edition
        const olKey = extractOLKey(data.pdfUrl);
        if (olKey) {
          const id = await findReadableEdition(olKey);
          setIaId(id);
        }
        setSearching(false);
      })
      .catch(() => setSearching(false));
  }, [bookId]);

  if (!book || searching) {
    return (
      <div style={{ padding: '2rem' }}>
        <Spin label={book ? 'Finding a readable version...' : 'Loading book...'} />
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '1rem',
        marginBottom: '1.5rem', flexWrap: 'wrap',
      }}>
        <button className="btn btn-secondary" onClick={() => navigate('/dashboard')} style={{ padding: '0.5rem 1rem', flexShrink: 0 }}>
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ fontSize: '1.4rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 0 }}>
            {book.title}
          </h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>by {book.author}</span>
        </div>
        {iaId && !useFallback && (
          <button className="btn btn-secondary" onClick={() => setUseFallback(true)} style={{ flexShrink: 0, fontSize: '0.85rem' }}>
            <Globe size={15} /> Other Sources
          </button>
        )}
      </div>

      {/* Content */}
      {iaId && !useFallback
        ? <EmbedReader iaId={iaId} book={book} onFallback={() => setUseFallback(true)} />
        : <FallbackReader book={book} />
      }
    </div>
  );
}

export default Reader;
