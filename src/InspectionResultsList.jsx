import React, { useEffect, useState } from 'react';
import { decodeInspectionBits, deriveResultStage } from './inspectionBits.js';

export default function InspectionResultsList({ onSelect }){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ caseNumber: '', containerNumber: '' });

  useEffect(() => { fetchResults(); }, []);

  async function fetchResults(){
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.caseNumber) params.append('caseNumber', filters.caseNumber);
    if (filters.containerNumber) params.append('containerNumber', filters.containerNumber);
    const resp = await fetch(`/inspection/results?${params.toString()}`);
    const data = await resp.json();
    setItems(Array.isArray(data)?data:[]);
    setLoading(false);
  }

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Inspection Results</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <input placeholder="Case #" value={filters.caseNumber} onChange={e=>setFilters(f=>({...f, caseNumber:e.target.value}))} />
        <input placeholder="Container #" value={filters.containerNumber} onChange={e=>setFilters(f=>({...f, containerNumber:e.target.value}))} />
        <button onClick={fetchResults} disabled={loading}>Search</button>
      </div>
      {loading && <div>Loading...</div>}
      <table style={{ width: '100%', fontSize: '0.85rem' }}>
        <thead>
          <tr>
            <th>Case</th>
            <th>Container</th>
            <th>Booking (Op)</th>
            <th>Operator</th>
            <th>Port</th>
            <th>Stage</th>
            <th>Flags</th>
          </tr>
        </thead>
        <tbody>
          {items.map(r => {
            const stage = r.resultStage || deriveResultStage({ inspectionResultTypeName: r.inspectionResultTypeName, propertyBits: r.propertyBits });
            const flags = decodeInspectionBits(r.propertyBits ?? r.flags?.bits ?? 0);
            return (
              <tr key={r.inspectionResultId} style={{ cursor:'pointer' }} onClick={()=>onSelect && onSelect(r.inspectionResultId)}>
                <td>{r.caseNumber}</td>
                <td>{r.containerNumber}</td>
                <td>{r.bookingReferenceOperator}</td>
                <td>{r.operatorOperator?.name}</td>
                <td>{r.port?.name}</td>
                <td>{stage}</td>
                <td>{flags.finalized?'F':''}{flags.rejectionApproved?'R':''}{flags.reworkApproved?'W':''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
