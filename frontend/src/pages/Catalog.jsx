import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, BookOpen, Globe, Library, ChevronLeft, ChevronRight, ExternalLink, Star, Calendar, User, X, Loader2, PlusCircle, CheckCircle, ArrowLeft } from 'lucide-react';

const OL = 'https://openlibrary.org';
const COVER = (id, s='M') => id ? `https://covers.openlibrary.org/b/id/${id}-${s}.jpg` : null;
const SZ = 20;

const GENRES = [
  { label: 'Fiction',      emoji: '📚', q: 'subject:fiction' },
  { label: 'Science',      emoji: '🔬', q: 'subject:science' },
  { label: 'History',      emoji: '🏛️', q: 'subject:history' },
  { label: 'Technology',   emoji: '💻', q: 'subject:technology' },
  { label: 'Romance',      emoji: '💕', q: 'subject:romance' },
  { label: 'Fantasy',      emoji: '🔮', q: 'subject:fantasy' },
  { label: 'Mystery',      emoji: '🕵️', q: 'subject:mystery' },
  { label: 'Biography',    emoji: '👤', q: 'subject:biography' },
  { label: 'Philosophy',   emoji: '🧠', q: 'subject:philosophy' },
  { label: 'Science Fiction', emoji: '🚀', q: 'subject:"science fiction"' },
  { label: 'Children',     emoji: '🧒', q: 'subject:children' },
  { label: 'Self-Help',    emoji: '💪', q: 'subject:"self-help"' },
];

function norm(d) {
  return {
    olKey: d.key,
    title: d.title || 'Unknown Title',
    author: d.author_name?.join(', ') || 'Unknown Author',
    year: d.first_publish_year || '',
    subjects: d.subject?.slice(0,3) || [],
    cover: COVER(d.cover_i),
    coverId: d.cover_i || null,
    rating: d.ratings_average ? parseFloat(d.ratings_average).toFixed(1) : null,
    ratingCount: d.ratings_count || 0,
    link: `${OL}${d.key}`,
  };
}

const FIELDS = 'key,title,author_name,first_publish_year,cover_i,subject,ratings_average,ratings_count';

async function fetchOL(q, page=1, limit=SZ) {
  const offset = (page-1)*limit;
  const r = await fetch(`${OL}/search.json?q=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}&fields=${FIELDS}`);
  const d = await r.json();
  return { books: (d.docs||[]).map(norm), total: d.numFound||0 };
}

/* ── Borrow from World Catalog (auto-import + borrow) ── */
async function borrowExternal(book) {
  const token = localStorage.getItem('token');
  let description = '';
  try {
    const r = await fetch(`${OL}${book.olKey}.json`);
    if (r.ok) { const d = await r.json(); const desc = d.description; description = typeof desc==='string'?desc:(desc?.value||''); }
  } catch {}
  const res = await fetch(`${process.env.REACT_APP_API_URL}/api/transactions/borrow-external`, {
    method:'POST',
    headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
    body: JSON.stringify({ title:book.title, author:book.author, genre:book.subjects[0]||'', description:description.slice(0,1000), coverImage:book.coverId?COVER(book.coverId,'L'):'', pdfUrl:book.link }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error||'Failed');
  return data;
}

/* ── Admin: Add to Library only (no borrow) ── */
async function addToLibrary(book) {
  const token = localStorage.getItem('token');
  let description = '';
  try {
    const r = await fetch(`${OL}${book.olKey}.json`);
    if (r.ok) { const d = await r.json(); const desc = d.description; description = typeof desc==='string'?desc:(desc?.value||''); }
  } catch {}
  const res = await fetch(`${process.env.REACT_APP_API_URL}/api/books`, {
    method:'POST',
    headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
    body: JSON.stringify({ title:book.title, author:book.author, genre:book.subjects[0]||'', description:description.slice(0,1000), coverImage:book.coverId?COVER(book.coverId,'L'):'', pdfUrl:book.link }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error||'Failed');
  return data;
}


/* ── UI Atoms ── */
function Spin() { return <div style={{display:'flex',justifyContent:'center',padding:'4rem'}}><Loader2 size={36} style={{color:'var(--primary)',animation:'spin 1s linear infinite'}}/></div>; }

function Toast({message,type,onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,3200);return()=>clearTimeout(t);},[onClose]);
  const c = type==='error'?'#f87171':'#4ade80';
  return <div style={{position:'fixed',bottom:'2rem',right:'2rem',zIndex:9999,display:'flex',alignItems:'center',gap:'.75rem',padding:'.9rem 1.4rem',borderRadius:'12px',background:type==='error'?'rgba(248,113,113,.12)':'rgba(74,222,128,.12)',border:`1px solid ${c}`,boxShadow:'0 8px 32px rgba(0,0,0,.4)',animation:'slideUp .3s ease',maxWidth:'360px'}}>
    {type==='error'?<X size={18} color={c}/>:<CheckCircle size={18} color={c}/>}
    <span style={{flex:1,fontSize:'.9rem'}}>{message}</span>
    <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'var(--text-muted)'}}><X size={14}/></button>
  </div>;
}

function BorrowBtn({book, onToast, style={}}) {
  const [st, setSt] = useState('idle');
  const go = async (e) => {
    e.stopPropagation(); setSt('loading');
    try { await borrowExternal(book); setSt('done'); onToast(`"${book.title}" borrowed! Check your Dashboard.`); }
    catch(err) { setSt('idle'); onToast(err.message,'error'); }
  };
  if (st==='done') return <button disabled className="btn" style={{...style,background:'rgba(74,222,128,.2)',color:'#4ade80',cursor:'default'}}><CheckCircle size={14}/> Borrowed ✓</button>;
  return <button className="btn" onClick={go} disabled={st==='loading'} style={{...style,background:'linear-gradient(135deg,#059669,#047857)',opacity:st==='loading'?.7:1}}>
    {st==='loading'?<Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>:<BookOpen size={14}/>}
    {st==='loading'?'Borrowing...':'Borrow Book'}
  </button>;
}

function AddBtn({book, onToast, style={}}) {
  const [st, setSt] = useState('idle');
  const go = async (e) => {
    e.stopPropagation(); setSt('loading');
    try { await addToLibrary(book); setSt('done'); onToast(`"${book.title}" added to library!`); }
    catch(err) { setSt('idle'); onToast(err.message,'error'); }
  };
  if (st==='done') return <button disabled className="btn" style={{...style,background:'rgba(74,222,128,.2)',color:'#4ade80',cursor:'default'}}><CheckCircle size={14}/> Added</button>;
  return <button className="btn btn-secondary" onClick={go} disabled={st==='loading'} style={{...style,opacity:st==='loading'?.7:1}}>
    {st==='loading'?<Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/>:<PlusCircle size={14}/>}
    {st==='loading'?'Adding...':'+ Add to Library'}
  </button>;
}

function BookCard({book, onClick, isLoggedIn, isAdmin, onToast}) {
  return <div className="book-card glass" style={{cursor:'pointer'}} onClick={onClick}>
    {book.cover ? <img src={book.cover} alt={book.title} className="book-cover" onError={e=>{e.target.style.display='none';e.target.nextSibling.style.display='flex';}}/>:null}
    <div className="book-cover" style={{display:book.cover?'none':'flex',background:'linear-gradient(135deg,rgba(79,70,229,.4),rgba(192,132,252,.3))',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:'.5rem'}}>
      <BookOpen size={40} color="#818cf8"/><span style={{fontSize:'.7rem',color:'#818cf8'}}>No cover</span>
    </div>
    <div className="book-info">
      <h3 className="book-title" style={{fontSize:'1rem'}}>{book.title}</h3>
      <span className="book-author" style={{display:'flex',alignItems:'center',gap:'.3rem'}}><User size={12}/>{book.author}</span>
      <div style={{display:'flex',gap:'.8rem',margin:'.5rem 0',fontSize:'.8rem',color:'var(--text-muted)'}}>
        {book.year&&<span style={{display:'flex',alignItems:'center',gap:'.2rem'}}><Calendar size={12}/>{book.year}</span>}
        {book.rating&&<span style={{display:'flex',alignItems:'center',gap:'.2rem',color:'#fbbf24'}}><Star size={12} fill="#fbbf24"/>{book.rating}</span>}
      </div>
      {book.subjects.length>0&&<div style={{display:'flex',flexWrap:'wrap',gap:'.3rem',marginBottom:'.8rem'}}>
        {book.subjects.map((s,i)=><span key={i} style={{fontSize:'.7rem',padding:'.1rem .5rem',borderRadius:'8px',background:'rgba(79,70,229,.15)',color:'#818cf8'}}>{s}</span>)}
      </div>}
      <div style={{marginTop:'auto',display:'flex',flexDirection:'column',gap:'.5rem'}}>
        {isLoggedIn&&<BorrowBtn book={book} onToast={onToast} style={{width:'100%',justifyContent:'center',fontSize:'.85rem'}}/>}
        {isAdmin&&<AddBtn book={book} onToast={onToast} style={{width:'100%',justifyContent:'center',fontSize:'.85rem'}}/>}
        <button className="btn btn-secondary" style={{width:'100%',justifyContent:'center',fontSize:'.85rem'}} onClick={e=>{e.stopPropagation();window.open(book.link,'_blank');}}>
          <ExternalLink size={14}/> View on Open Library
        </button>
      </div>
    </div>
  </div>;
}

function Paginator({page, total, pageSize, onChange}) {
  const pages = Math.min(Math.ceil(total/pageSize),500);
  if(pages<=1) return null;
  return <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:'1rem',marginTop:'2.5rem'}}>
    <button className="btn btn-secondary" onClick={()=>{onChange(page-1);window.scrollTo(0,0);}} disabled={page===1} style={{opacity:page===1?.4:1}}><ChevronLeft size={18}/> Prev</button>
    <span style={{color:'var(--text-muted)',fontSize:'.9rem'}}>Page <strong style={{color:'var(--text-main)'}}>{page}</strong> / {pages.toLocaleString()}</span>
    <button className="btn btn-secondary" onClick={()=>{onChange(page+1);window.scrollTo(0,0);}} disabled={page===pages} style={{opacity:page===pages?.4:1}}>Next <ChevronRight size={18}/></button>
  </div>;
}

/* ── Genre Detail View ── */
function GenreView({genre, isLoggedIn, isAdmin, onToast, onBack}) {
  const [books,setBooks]=useState([]); const [total,setTotal]=useState(0); const [page,setPage]=useState(1); const [loading,setLoading]=useState(true);
  useEffect(()=>{
    setLoading(true); setBooks([]);
    fetchOL(genre.q,page).then(({books:b,total:t})=>{setBooks(b);setTotal(t);}).finally(()=>setLoading(false));
  },[genre.q,page]);
  return <div>
    <button className="btn btn-secondary" onClick={onBack} style={{marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:'.5rem'}}><ArrowLeft size={16}/> All Genres</button>
    <h2 style={{fontSize:'2rem',marginBottom:'.3rem'}}>{genre.emoji} {genre.label}</h2>
    {!loading&&<p style={{color:'var(--text-muted)',marginBottom:'1.5rem',fontSize:'.9rem'}}>{total.toLocaleString()} books found</p>}
    {loading?<Spin/>:<div className="book-grid">{books.map(b=><BookCard key={b.olKey} book={b} isLoggedIn={isLoggedIn} isAdmin={isAdmin} onToast={onToast} onClick={()=>window.open(b.link,'_blank')}/>)}</div>}
    <Paginator page={page} total={total} pageSize={SZ} onChange={setPage}/>
  </div>;
}

/* ── Genre Grid ── */
function GenreGrid({onSelect}) {
  return <div>
    <p style={{color:'var(--text-muted)',marginBottom:'1.5rem'}}>Choose a genre to browse all books.</p>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:'1rem'}}>
      {GENRES.map(g=><button key={g.q} onClick={()=>onSelect(g)} className="glass" style={{padding:'2rem 1rem',border:'1px solid var(--glass-border)',borderRadius:'16px',cursor:'pointer',background:'rgba(30,41,59,.6)',color:'var(--text-main)',display:'flex',flexDirection:'column',alignItems:'center',gap:'.75rem',fontSize:'.95rem',fontWeight:600,transition:'all .25s'}}
        onMouseEnter={e=>{e.currentTarget.style.background='rgba(79,70,229,.2)';e.currentTarget.style.transform='translateY(-4px)';}}
        onMouseLeave={e=>{e.currentTarget.style.background='rgba(30,41,59,.6)';e.currentTarget.style.transform='none';}}>
        <span style={{fontSize:'2.2rem'}}>{g.emoji}</span>{g.label}
      </button>)}
    </div>
  </div>;
}

/* ── Search Results ── */
function SearchResults({query, isLoggedIn, isAdmin, onToast}) {
  const [books,setBooks]=useState([]); const [total,setTotal]=useState(0); const [page,setPage]=useState(1); const [loading,setLoading]=useState(true);
  useEffect(()=>{
    setLoading(true); setBooks([]);
    fetchOL(query,page).then(({books:b,total:t})=>{setBooks(b);setTotal(t);}).finally(()=>setLoading(false));
  },[query,page]);
  return <div>
    {!loading&&<p style={{color:'var(--text-muted)',marginBottom:'1.5rem',fontSize:'.9rem'}}>Found <strong style={{color:'var(--text-main)'}}>{total.toLocaleString()}</strong> results for "<em>{query}</em>" — Page {page}</p>}
    {loading?<Spin/>:books.length===0?<div style={{textAlign:'center',padding:'4rem',color:'var(--text-muted)'}}><Globe size={48} style={{marginBottom:'1rem',opacity:.4}}/><p>No results. Try different keywords.</p></div>
      :<div className="book-grid">{books.map(b=><BookCard key={b.olKey} book={b} isLoggedIn={isLoggedIn} isAdmin={isAdmin} onToast={onToast} onClick={()=>window.open(b.link,'_blank')}/>)}</div>}
    <Paginator page={page} total={total} pageSize={SZ} onChange={setPage}/>
  </div>;
}

/* ── Autocomplete SearchBox ── */
function SearchBox({ onSearch, initialValue = '' }) {
  const [input, setInput] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSug(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSuggestions = useCallback(async (q) => {
    if (q.trim().length < 2) { setSuggestions([]); return; }
    try {
      const r = await fetch(`${OL}/search.json?q=${encodeURIComponent(q)}&limit=8&fields=title,author_name`);
      const d = await r.json();
      setSuggestions((d.docs || []).map(b => ({ title: b.title, author: b.author_name?.[0] || '' })));
    } catch { setSuggestions([]); }
  }, []);

  const handleChange = e => {
    const v = e.target.value;
    setInput(v); setActiveIdx(-1); setShowSug(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 300);
  };

  const pick = (title) => { setInput(title); setSuggestions([]); setShowSug(false); onSearch(title); };

  const handleKey = e => {
    if (!showSug || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Enter' && activeIdx >= 0) { e.preventDefault(); pick(suggestions[activeIdx].title); }
    else if (e.key === 'Escape') setShowSug(false);
  };

  const submit = e => { e.preventDefault(); const q = input.trim(); if (!q) return; setShowSug(false); onSearch(q); };

  const highlight = (text, query) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return <>{text.slice(0, idx)}<strong style={{ color: 'var(--primary)' }}>{text.slice(idx, idx + query.length)}</strong>{text.slice(idx + query.length)}</>;
  };

  return (
    <div ref={wrapRef} style={{ position: 'relative', maxWidth: '700px', marginBottom: '1.5rem' }}>
      <form onSubmit={submit} className="search-bar glass" style={{ padding: '.4rem', borderRadius: '12px' }}>
        <input
          id="world-search-input" type="text" className="input-field"
          placeholder="Search any book, author, or topic across millions of books..."
          value={input}
          onChange={handleChange}
          onKeyDown={handleKey}
          onFocus={() => { if (suggestions.length > 0) setShowSug(true); }}
          style={{ border: 'none', background: 'transparent' }}
          autoComplete="off"
        />
        <button type="submit" className="btn" style={{ padding: '.7rem 1.4rem' }}><Search size={18} /> Search</button>
      </form>

      {showSug && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 500,
          background: 'rgba(15,23,42,0.97)', border: '1px solid var(--glass-border)',
          borderRadius: '12px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(12px)', overflow: 'hidden',
        }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => pick(s.title)}
              style={{
                padding: '.75rem 1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.75rem',
                background: i === activeIdx ? 'rgba(79,70,229,0.25)' : 'transparent',
                borderBottom: i < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                transition: 'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(79,70,229,0.15)'}
              onMouseLeave={e => e.currentTarget.style.background = i === activeIdx ? 'rgba(79,70,229,0.25)' : 'transparent'}
            >
              <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {highlight(s.title, input)}
                </div>
                {s.author && <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.1rem' }}>{s.author}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── WorldCatalog tab ── */
function WorldCatalog({isLoggedIn, isAdmin, onToast, initialQuery}) {
  const [query,setQuery]=useState(initialQuery||''); const [genre,setGenre]=useState(null);
  const handleSearch = q=>{ setGenre(null); setQuery(q); };
  const selectGenre = g=>{ setGenre(g); setQuery(''); };
  const back = ()=>{ setGenre(null); setQuery(''); };
  const mode = genre?'genre':query?'search':'browse';
  return <div>
    <SearchBox onSearch={handleSearch} initialValue={initialQuery||''}/>
    {mode!=='browse'&&<button className="btn btn-secondary" onClick={back} style={{marginBottom:'1.5rem',display:'inline-flex',alignItems:'center',gap:'.5rem'}}><ArrowLeft size={16}/> Browse Genres</button>}
    {mode==='browse'&&<GenreGrid onSelect={selectGenre}/>}
    {mode==='genre'&&<GenreView genre={genre} isLoggedIn={isLoggedIn} isAdmin={isAdmin} onToast={onToast} onBack={back}/>}
    {mode==='search'&&<SearchResults query={query} isLoggedIn={isLoggedIn} isAdmin={isAdmin} onToast={onToast}/>}
  </div>;
}

/* ── Local Catalog tab ── */
function LocalCatalog() {
  const [books,setBooks]=useState([]); const [loading,setLoading]=useState(true); const [input,setInput]=useState(''); const [query,setQuery]=useState('');
  const navigate=useNavigate();
  useEffect(()=>{
    setLoading(true);
    const url=query?`${process.env.REACT_APP_API_URL}/api/books?search=${encodeURIComponent(query)}`:`${process.env.REACT_APP_API_URL}/api/books`;
    fetch(url).then(r=>r.json()).then(setBooks).catch(()=>{}).finally(()=>setLoading(false));
  },[query]);
  const borrow=async(id)=>{
    const token=localStorage.getItem('token'); if(!token){navigate('/login');return;}
    const r=await fetch(`${process.env.REACT_APP_API_URL}/api/transactions/borrow`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({bookId:id})});
    const d=await r.json(); if(r.ok){alert('Borrowed!');setBooks(p=>p.map(b=>b.id===id?{...b,available:false}:b));}else alert(d.error);
  };
  return <div>
    <form onSubmit={e=>{e.preventDefault();setQuery(input.trim());}} className="search-bar glass" style={{padding:'.4rem',borderRadius:'12px',marginBottom:'2rem',maxWidth:'600px'}}>
      <input id="local-search-input" type="text" className="input-field" placeholder="Search your library..." value={input} onChange={e=>setInput(e.target.value)} style={{border:'none',background:'transparent'}}/>
      <button type="submit" className="btn" style={{padding:'.7rem 1.4rem'}}><Search size={18}/> Search</button>
    </form>
    {loading?<Spin/>:books.length===0?<div style={{textAlign:'center',padding:'4rem',color:'var(--text-muted)'}}><BookOpen size={48} style={{opacity:.4,marginBottom:'1rem'}}/><p>No books found. Try the World Catalog!</p></div>
      :<div className="book-grid">{books.map(b=><div key={b.id} className="book-card glass">
        {b.coverImage?<img src={b.coverImage} alt={b.title} className="book-cover"/>:<div className="book-cover" style={{background:'linear-gradient(135deg,rgba(79,70,229,.4),rgba(192,132,252,.3))',display:'flex',alignItems:'center',justifyContent:'center'}}><BookOpen size={48} color="#818cf8"/></div>}
        <div className="book-info">
          <h3 className="book-title">{b.title}</h3>
          <span className="book-author">{b.author}</span>
          {b.genre&&<span style={{fontSize:'.8rem',color:'var(--primary)',marginBottom:'1rem',display:'inline-block'}}>{b.genre}</span>}
          <div style={{marginTop:'auto',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <span style={{fontSize:'.9rem',color:b.available?'#4ade80':'#f87171'}}>{b.available?'● Available':'● Borrowed'}</span>
            <button className="btn" onClick={()=>borrow(b.id)} disabled={!b.available} style={{opacity:b.available?1:.5,cursor:b.available?'pointer':'not-allowed'}}>Borrow</button>
          </div>
        </div>
      </div>)}</div>}
  </div>;
}

/* ── Main ── */
export default function Catalog({user}) {
  const location=useLocation(); const navigate=useNavigate();
  const sp=new URLSearchParams(location.search);
  const initialQuery=sp.get('search')||''; const initialTab=sp.get('tab')==='world'?'world':'local';
  const [tab,setTab]=useState(initialTab); const [toast,setToast]=useState(null);
  const isLoggedIn=!!user;
  const isAdmin=user?.role==='admin';
  const switchTab=t=>{setTab(t);navigate(`/catalog?tab=${t}`,{replace:true});};
  const showToast=(msg,type='success')=>setToast({message:msg,type});
  return <div>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes slideUp{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}} .tab-btn{padding:.7rem 1.8rem;border-radius:10px;border:1px solid var(--glass-border);cursor:pointer;font-size:.95rem;font-weight:600;display:flex;align-items:center;gap:.5rem;transition:all .25s;background:transparent;color:var(--text-muted)}.tab-btn.active{background:var(--primary);color:white;border-color:var(--primary);box-shadow:0 4px 20px rgba(79,70,229,.35)}.tab-btn:not(.active):hover{background:rgba(255,255,255,.06);color:var(--text-main)}`}</style>
    <div style={{marginBottom:'2rem'}}>
      <h2 style={{fontSize:'2.2rem',background:'linear-gradient(to right,#818cf8,#c084fc)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',marginBottom:'.4rem'}}>Book Catalog</h2>
      <p style={{color:'var(--text-muted)'}}>Browse your local library or explore millions of books by genre or search.</p>
    </div>
    <div style={{display:'flex',gap:'.75rem',marginBottom:'2.5rem'}}>
      <button id="tab-local" className={`tab-btn ${tab==='local'?'active':''}`} onClick={()=>switchTab('local')}><Library size={18}/> Local Library</button>
      <button id="tab-world" className={`tab-btn ${tab==='world'?'active':''}`} onClick={()=>switchTab('world')}>
        <Globe size={18}/> World Catalog <span style={{fontSize:'.65rem',padding:'.1rem .5rem',borderRadius:'8px',background:tab==='world'?'rgba(255,255,255,.2)':'rgba(79,70,229,.2)',color:tab==='world'?'white':'#818cf8'}}>50M+ books</span>
      </button>
    </div>
    {tab==='local'?<LocalCatalog/>:<WorldCatalog isLoggedIn={isLoggedIn} isAdmin={isAdmin} onToast={showToast} initialQuery={initialQuery}/>}
    {toast&&<Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)}/>}
  </div>;
}
