import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Download, ExternalLink, Loader2, User, FileText, Globe, ChevronLeft, ChevronRight } from 'lucide-react';

const GUTENDEX = 'https://gutendex.com/books';

// Reliable CORS proxy (allorigins.win is more stable than corsproxy.io)
const PROXY = (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;

function getCover(book) { return book.formats?.['image/jpeg'] || null; }
function getHtmlUrl(book) {
  return book.formats?.['text/html'] || book.formats?.['text/html; charset=utf-8'] || null;
}
function getTextUrl(book) {
  return book.formats?.['text/plain; charset=utf-8'] || book.formats?.['text/plain'] || null;
}
function getEpubUrl(book) { return book.formats?.['application/epub+zip'] || null; }

function Spin({ label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '4rem', color: 'var(--text-muted)' }}>
      <Loader2 size={40} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
      {label && <p style={{ fontSize: '.95rem' }}>{label}</p>}
    </div>
  );
}

/* ── Plain-text reader with pagination ── */
function TextReader({ url }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const CHARS = 4000;

  useEffect(() => {
    setLoading(true); setError(false); setPage(0);
    // Try direct first, then proxy
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(); return r.text(); })
      .catch(() => fetch(PROXY(url)).then(r => { if (!r.ok) throw new Error(); return r.text(); }))
      .then(t => { setText(t); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [url]);

  if (loading) return <Spin label="Loading ebook text..." />;
  if (error) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <FileText size={40} style={{ opacity: .4, marginBottom: '1rem' }} />
      <p style={{ marginBottom: '1.2rem' }}>Could not load text directly.</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="btn" style={{ display: 'inline-flex', textDecoration: 'none' }}>
        <ExternalLink size={16} /> Open on Gutenberg
      </a>
    </div>
  );

  const pages = Math.ceil(text.length / CHARS);
  const chunk = text.slice(page * CHARS, (page + 1) * CHARS);

  return (
    <div>
      <div style={{
        background: '#fff', color: '#1e293b', borderRadius: '12px', padding: '2.5rem 3rem',
        fontFamily: "'Georgia', serif", lineHeight: 1.9, fontSize: '1.05rem',
        maxHeight: '65vh', overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}>
        {chunk}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={{ opacity: page === 0 ? .4 : 1 }}>
          <ChevronLeft size={16} /> Previous
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: '.9rem' }}>
          Section <strong style={{ color: 'var(--text-main)' }}>{page + 1}</strong> of {pages}
        </span>
        <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(pages - 1, p + 1))} disabled={page === pages - 1} style={{ opacity: page === pages - 1 ? .4 : 1 }}>
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── HTML reader: fetches via proxy, renders as safe HTML blob ── */
function HtmlReader({ url, title }) {
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true); setError(false);
    fetch(url)
      .then(r => { if (!r.ok) throw new Error(); return r.text(); })
      .catch(() => fetch(PROXY(url)).then(r => { if (!r.ok) throw new Error(); return r.text(); }))
      .then(t => { setHtml(t); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [url]);

  if (loading) return <Spin label="Loading ebook..." />;
  if (error) return (
    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
      <BookOpen size={40} style={{ opacity: .4, marginBottom: '1rem' }} />
      <p style={{ marginBottom: '1.2rem' }}>Could not load HTML version.</p>
      <a href={url} target="_blank" rel="noopener noreferrer" className="btn" style={{ display: 'inline-flex', textDecoration: 'none' }}>
        <ExternalLink size={16} /> Open on Gutenberg
      </a>
    </div>
  );

  // Render inside a sandboxed blob iframe
  const blob = new Blob([html], { type: 'text/html' });
  const blobUrl = URL.createObjectURL(blob);

  return (
    <div style={{ position: 'relative' }}>
      <iframe
        src={blobUrl}
        title={`Reading: ${title}`}
        style={{ width: '100%', minHeight: '75vh', border: 'none', borderRadius: '12px', background: '#fff' }}
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
}

export default function EbookReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('info'); // 'info' | 'html' | 'text'

  useEffect(() => {
    fetch(`${GUTENDEX}/${id}`)
      .then(r => r.json())
      .then(d => { setBook(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: '2rem' }}><Spin label="Loading book details..." /></div>;
  if (!book) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Book not found.</div>;

  const cover = getCover(book);
  const htmlUrl = getHtmlUrl(book);
  const textUrl = getTextUrl(book);
  const epubUrl = getEpubUrl(book);
  const subjects = book.subjects?.slice(0, 4).map(s => s.split('--')[0].trim()) || [];

  return (
    <div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Back + Title bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={() => { if (mode === 'info') navigate('/ebooks'); else setMode('info'); }} style={{ flexShrink: 0 }}>
          <ArrowLeft size={18} /> {mode === 'info' ? 'Ebooks' : 'Book Info'}
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: 0, lineHeight: 1.3 }}>{book.title}</h2>
          <span style={{ color: 'var(--primary)', fontSize: '.9rem' }}>{book.authors?.map(a => a.name).join(', ')}</span>
        </div>
      </div>

      {/* INFO view */}
      {mode === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2rem', alignItems: 'start' }}>
          {/* Cover */}
          <div style={{ flexShrink: 0 }}>
            {cover
              ? <img src={cover} alt={book.title} style={{ width: '180px', height: '260px', objectFit: 'cover', borderRadius: '14px', boxShadow: '0 8px 32px rgba(0,0,0,.5)' }} />
              : <div style={{ width: '180px', height: '260px', borderRadius: '14px', background: 'linear-gradient(135deg,rgba(79,70,229,.5),rgba(192,132,252,.4))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '.5rem' }}>
                  <BookOpen size={52} color="#818cf8" />
                  <span style={{ fontSize: '.72rem', color: '#c084fc' }}>No cover</span>
                </div>
            }
          </div>

          {/* Details + Actions */}
          <div>
            <div className="glass" style={{ padding: '1.8rem', borderRadius: '16px', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center', marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '.88rem' }}>
                <User size={14} /> {book.authors?.map(a => `${a.name}${a.birth_year ? ` (${a.birth_year}–${a.death_year || ''})` : ''}`).join(', ')}
              </div>

              {subjects.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '1.2rem' }}>
                  {subjects.map((s, i) => (
                    <span key={i} style={{ fontSize: '.75rem', padding: '.2rem .6rem', borderRadius: '10px', background: 'rgba(79,70,229,.15)', color: '#818cf8' }}>{s}</span>
                  ))}
                </div>
              )}

              <p style={{ color: 'var(--text-muted)', fontSize: '.88rem', lineHeight: 1.6, marginBottom: '1.2rem' }}>
                ↓ <strong style={{ color: 'var(--text-main)' }}>{book.download_count?.toLocaleString()}</strong> downloads &nbsp;•&nbsp;
                Languages: <strong style={{ color: 'var(--text-main)' }}>{book.languages?.join(', ').toUpperCase()}</strong>
              </p>

              {/* Read buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {htmlUrl && (
                  <button className="btn" onClick={() => setMode('html')}
                    style={{ justifyContent: 'flex-start', padding: '1rem 1.25rem', background: 'linear-gradient(135deg,#4f46e5,#7c3aed)', fontSize: '.95rem' }}>
                    <BookOpen size={18} /> Read Online (HTML) — Best Experience
                  </button>
                )}
                {textUrl && (
                  <button className="btn btn-secondary" onClick={() => setMode('text')}
                    style={{ justifyContent: 'flex-start', padding: '1rem 1.25rem', fontSize: '.95rem' }}>
                    <FileText size={18} /> Read as Plain Text
                  </button>
                )}
                {epubUrl && (
                  <a href={epubUrl} download className="btn btn-secondary"
                    style={{ justifyContent: 'flex-start', padding: '1rem 1.25rem', fontSize: '.95rem', textDecoration: 'none' }}>
                    <Download size={18} /> Download EPUB
                  </a>
                )}
                <a href={`https://www.gutenberg.org/ebooks/${id}`} target="_blank" rel="noopener noreferrer"
                  className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem 1.25rem', fontSize: '.95rem', textDecoration: 'none' }}>
                  <Globe size={18} /> View on Project Gutenberg
                </a>
              </div>
            </div>

            {!htmlUrl && !textUrl && (
              <div style={{ padding: '.8rem 1.2rem', borderRadius: '10px', background: 'rgba(251,191,36,.08)', border: '1px solid rgba(251,191,36,.2)', fontSize: '.85rem', color: '#fbbf24' }}>
                ⚠️ Direct reading not available for this book. Use the download or Gutenberg link above.
              </div>
            )}
          </div>
        </div>
      )}

      {/* HTML reader */}
      {mode === 'html' && htmlUrl && <HtmlReader url={htmlUrl} title={book.title} />}

      {/* Text reader */}
      {mode === 'text' && textUrl && <TextReader url={textUrl} />}
    </div>
  );
}
