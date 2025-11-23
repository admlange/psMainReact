import React, { useEffect, useRef, useState } from 'react';

// Props: endpoint (string), value (id), onChange(id, item), placeholder
// Behavior: debounced query on input change; preserves previous list until new list arrives (no flicker).
export default function LookaheadCombobox({ endpoint, value, onChange, placeholder='Search...', disabled=false, minChars=1 }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const debounceRef = useRef(null);
  const mountedRef = useRef(true);
  const listRef = useRef(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  // Simple LRU cache (in-memory per page refresh)
  if (!window.__lookupCache) window.__lookupCache = new Map();
  const cache = window.__lookupCache;

  // Resolve initial value by id
  useEffect(()=>{
    mountedRef.current = true;
    if(value){
      fetch(`${endpoint}?id=${value}`)
        .then(r=>r.json())
        .then(r=>{ if(mountedRef.current && Array.isArray(r) && r.length){ setItems(r); } })
        .catch(()=>{});
    }
    return ()=>{ mountedRef.current = false; if(abortRef.current) abortRef.current.abort(); };
  },[endpoint, value]);

  useEffect(()=>{
    if(disabled) return;
    if(debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(()=>{
      const q = query.trim();
      if(q.length < minChars){ setItems([]); setHighlightIndex(-1); return; }
      // Cache check
      const cacheKey = `${endpoint}|${q}`;
      if(cache.has(cacheKey)){
        setItems(cache.get(cacheKey));
        setHighlightIndex(-1);
        return;
      }
      if(abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setLoading(true); setError(null);
      fetch(`${endpoint}?q=${encodeURIComponent(q)}`, { signal: abortRef.current.signal })
        .then(r=>r.json())
        .then(r=>{ if(!mountedRef.current) return; const arr = Array.isArray(r)? r: []; setItems(arr); cache.set(cacheKey, arr); // enforce LRU size 20
          if(cache.size > 20){ const firstKey = cache.keys().next().value; cache.delete(firstKey); }
          setHighlightIndex(-1);
        })
        .catch(e=>{ if(e.name !== 'AbortError'){ setError(e.message); }} )
        .finally(()=>{ if(mountedRef.current) setLoading(false); });
    }, 250);
  },[query, endpoint, disabled, minChars]);

  function select(id){
    const item = items.find(i=> String(i.Id)===String(id));
    if(onChange) onChange(id, item);
    setHighlightIndex(-1);
  }

  function onKeyDown(e){
    if(!items.length) return;
    if(e.key==='ArrowDown'){
      e.preventDefault();
      setHighlightIndex(h => Math.min(items.length-1, h+1));
    } else if(e.key==='ArrowUp'){
      e.preventDefault();
      setHighlightIndex(h => Math.max(0, h-1));
    } else if(e.key==='Enter'){
      if(highlightIndex>=0){ e.preventDefault(); select(items[highlightIndex].Id); }
    } else if(e.key==='Escape'){
      setItems([]); setHighlightIndex(-1);
    }
  }

  useEffect(()=>{
    if(highlightIndex>=0 && listRef.current){
      const child = listRef.current.children[highlightIndex];
      if(child) child.scrollIntoView({ block:'nearest' });
    }
  },[highlightIndex]);

  return (
    <div style={{ position:'relative', width:'100%' }}>
      <input
        type='text'
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        onChange={e=> setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        role='combobox'
        aria-expanded={!!items.length}
        aria-autocomplete='list'
        aria-controls='lookup-list'
        style={{ width:'100%', padding:'4px', boxSizing:'border-box' }}
      />
      {loading && <div style={{ position:'absolute', top:2, right:6, fontSize:'0.7rem' }}>Loading...</div>}
      {error && <div style={{ color:'red', fontSize:'0.7rem' }}>{error}</div>}
      {!!items.length && (
        <div id='lookup-list' ref={listRef} role='listbox' style={{ maxHeight:140, overflowY:'auto', border:'1px solid #ccc', marginTop:4, background:'#fff', zIndex:5 }}>
          {items.map((it, idx)=> (
            <div key={it.Id}
                 role='option'
                 aria-selected={String(it.Id)===String(value)}
                 onMouseDown={()=> select(it.Id)}
                 style={{ padding:'4px', cursor:'pointer', background: idx===highlightIndex? '#cde8ff' : (String(it.Id)===String(value)? '#e6f3ff':'transparent') }}>
              {it.Label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
