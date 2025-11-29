import React, { useEffect, useState, useMemo } from 'react';
import { decodeInspectionBits, deriveResultStage } from './inspectionBits.js';

const BACKEND_BASE = (import.meta?.env?.VITE_BACKEND_BASE_URL) || 'http://localhost:3100';

export default function InspectionResultsList({ onSelect, token }){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ caseNumber: '', containerNumber: '', stage: 'all' });

  useEffect(() => { fetchResults(); }, []);

  async function fetchResults(){
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.caseNumber) params.append('caseNumber', filters.caseNumber);
    if (filters.containerNumber) params.append('containerNumber', filters.containerNumber);
    // Stage filtering is client-side for now; backend resultStage already computed; optionally pass later
    const resp = await fetch(`${BACKEND_BASE}/inspection/results?${params.toString()}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    const data = await resp.json();
    setItems(Array.isArray(data)?data:[]);
    setLoading(false);
  }

  const filteredItems = useMemo(() => {
    if (filters.stage === 'all') return items;
    return items.filter(r => {
      const stage = r.resultStage || deriveResultStage({ inspectionResultTypeName: r.inspectionResultTypeName, propertyBits: r.propertyBits });
      return stage === filters.stage;
    });
  }, [items, filters.stage]);

  const stagesPresent = useMemo(() => {
    const set = new Set();
    items.forEach(r => set.add(r.resultStage || deriveResultStage({ inspectionResultTypeName: r.inspectionResultTypeName, propertyBits: r.propertyBits })) );
    return Array.from(set.values()).sort();
  }, [items]);

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>Inspection Results</h2>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginBottom:'0.75rem' }}>
        <input style={{ flex:'1 1 160px' }} placeholder="Case #" value={filters.caseNumber} onChange={e=>setFilters(f=>({...f, caseNumber:e.target.value}))} />
        <input style={{ flex:'1 1 160px' }} placeholder="Container #" value={filters.containerNumber} onChange={e=>setFilters(f=>({...f, containerNumber:e.target.value}))} />
        <select style={{ flex:'0 0 160px' }} value={filters.stage} onChange={e=>setFilters(f=>({...f, stage:e.target.value}))}>
          <option value="all">All Stages</option>
          {stagesPresent.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={fetchResults} disabled={loading} style={{ flex:'0 0 auto' }}>Search</button>
      </div>
      {loading && <div>Loading...</div>}
      <div style={{ display:'grid', gap:'0.75rem' }}>
        {filteredItems.map(r => {
          const stage = r.resultStage || deriveResultStage({ inspectionResultTypeName: r.inspectionResultTypeName, propertyBits: r.propertyBits });
          const flags = decodeInspectionBits(r.propertyBits ?? r.flags?.bits ?? 0);
          const flagBadges = [
            flags.finalized && { label:'Finalized', color:'#2563eb' },
            flags.rejectionApproved && { label:'Rejection Approved', color:'#dc2626' },
            flags.reworkApproved && { label:'Rework Approved', color:'#f59e0b' }
          ].filter(Boolean);
          return (
            <div key={r.inspectionResultId}
              onClick={()=>onSelect && onSelect(r.inspectionResultId)}
              style={{ cursor:'pointer', border:'1px solid #e5e7eb', borderRadius:8, padding:'0.75rem 0.9rem', background:'#fff', boxShadow:'0 1px 2px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', gap:'0.4rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', gap:'0.75rem' }}>
                <div style={{ fontWeight:600 }}>{r.caseNumber || '—'} / {r.containerNumber || '—'}</div>
                <div style={{ fontSize:12, fontWeight:500, padding:'2px 6px', borderRadius:4, background:'#f3f4f6', color:'#374151' }}>{stage}</div>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', fontSize:12 }}>
                {r.bookingReferenceOperator ? <span><strong>Booking:</strong> {r.bookingReferenceOperator}</span> : null}
                {r.operatorOperator?.name ? <span><strong>Operator:</strong> {r.operatorOperator.name}</span> : null}
                {r.port?.name ? <span><strong>Port:</strong> {r.port.name}</span> : null}
              </div>
              {flagBadges.length > 0 ? (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.35rem', marginTop:2 }}>
                  {flagBadges.map(f => (
                    <span key={f.label} style={{ fontSize:11, background:f.color, color:'#fff', padding:'2px 6px', borderRadius:4 }}>{f.label}</span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {(!loading && filteredItems.length === 0) ? <div style={{ fontSize:12, color:'#6b7280' }}>No results.</div> : null}
      </div>
    </div>
  );
}
