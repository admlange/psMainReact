import React, { useEffect, useState } from 'react';
import LookaheadCombobox from './LookaheadCombobox.jsx';
import { decodeInspectionBits, deriveResultStage } from './inspectionBits.js';

export default function InspectionResultDetail({ id }) {
  const [detail, setDetail] = useState(null);
  const [operatorId, setOperatorId] = useState(null); // currently selected operator id (operatorId_operator)
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true); setError(null);
      try {
        const resp = await fetch(`/inspection/results/${id}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        setDetail(data);
        // backend shape: operatorOperator: { id, name }
        setOperatorId(data.operatorOperator?.id || null);
      } catch (e) { setError(e.message); }
      setLoading(false);
    })();
  }, [id]);

  if (!id) return <div>No inspection selected.</div>;
  if (loading) return <div>Loading detail...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!detail) return <div>Not found.</div>;

  const stage = detail.resultStage || deriveResultStage({ inspectionResultTypeName: detail.inspectionResultTypeName, propertyBits: detail.propertyBits });
  const flags = decodeInspectionBits(detail.propertyBits);

  const [tab, setTab] = useState('summary');
  async function loadContents(){
    const resp = await fetch(`/inspection/results/${id}/contents`); const data = await resp.json(); setContents(data);
  }
  const [contents, setContents] = useState([]);
  const [files, setFiles] = useState([]);
  const [activities, setActivities] = useState([]);
  async function loadFiles(){ const resp = await fetch(`/inspection/results/${id}/files`); setFiles(await resp.json()); }
  async function loadActivities(){ const resp = await fetch(`/inspection/results/${id}/activities`); setActivities(await resp.json()); }
  useEffect(()=>{ if(tab==='contents') loadContents(); if(tab==='files') loadFiles(); if(tab==='activities') loadActivities(); },[tab]);
  async function ensureDevToken() {
    if (window.__devToken) return window.__devToken;
    try {
      const resp = await fetch('/oauth2/dev-token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ inspectionCompanyId: 1 }) });
      if (!resp.ok) throw new Error('Unable to acquire dev token');
      const data = await resp.json();
      window.__devToken = data.access_token;
      return window.__devToken;
    } catch (e) {
      throw e;
    }
  }

  const dirty = detail && (operatorId !== (detail.operatorOperator?.id || null));

  async function saveOperatorChange() {
    if (!dirty || !detail) return;
    setSaving(true); setSaveError(null); setSaveSuccess(false);
    try {
      const token = await ensureDevToken();
      const resp = await fetch(`/inspection/results/${detail.inspectionResultId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ operatorIdOperator: operatorId || null })
      });
      if (!resp.ok) throw new Error(`Save failed HTTP ${resp.status}`);
      const updated = await resp.json();
      setDetail(updated);
      setOperatorId(updated.operatorOperator?.id || null);
      setSaveSuccess(true);
      setTimeout(()=> setSaveSuccess(false), 2500);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ padding: '1rem', border:'1px solid #ccc', borderRadius:4 }}>
      <h3>Inspection #{detail.inspectionResultId}</h3>
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.5rem' }}>
        {['summary','contents','files','activities'].map(t => <button key={t} onClick={()=>setTab(t)} disabled={tab===t}>{t}</button>)}
      </div>
      <p><strong>Case:</strong> {detail.caseNumber} | <strong>Container:</strong> {detail.containerNumber}</p>
      <div style={{ marginBottom:'0.75rem' }}>
        <label style={{ fontSize:'0.65rem', display:'block', fontWeight:'bold' }}>Operator Lookup</label>
        <LookaheadCombobox endpoint='/lookup/operators' value={operatorId} onChange={(id,item)=> setOperatorId(id)} placeholder='Type operator name...' />
        <div style={{ marginTop: 4, display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <button disabled={!dirty || saving} onClick={saveOperatorChange}>{saving ? 'Saving...' : 'Save Operator'}</button>
          {dirty && !saving && <span style={{ fontSize:'0.65rem', color:'#555' }}>Unsaved change</span>}
          {saveSuccess && <span style={{ fontSize:'0.65rem', color:'green' }}>Saved</span>}
          {saveError && <span style={{ fontSize:'0.65rem', color:'red' }}>Error: {saveError}</span>}
        </div>
      </div>
      <p><strong>Stage:</strong> {stage} | <strong>Flags:</strong> {flags.finalized?'Finalized ':''}{flags.rejectionApproved?'RejectionApproved ':''}{flags.reworkApproved?'ReworkApproved':''}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <div><strong>Operator:</strong> {detail.operatorOperator?.name}</div>
        <div><strong>Owner:</strong> {detail.operatorOwner?.name}</div>
        <div><strong>Port:</strong> {detail.port?.name}</div>
        <div><strong>Vessel:</strong> {detail.vesselName}</div>
        <div><strong>Result Type Id:</strong> {detail.inspectionResultTypeId ?? '—'}</div>
        <div><strong>Incident Type Id:</strong> {detail.incidentTypeId ?? '—'}</div>
      </div>
      <hr />
      <p><strong>Remarks:</strong> {detail.remarks}</p>
      <p><strong>Rework Remarks:</strong> {detail.reworkRemarks}</p>
      <p><strong>Costs:</strong> Est {detail.estimatedCosts} ({detail.estimatedCostsDescription}) | Final {detail.finalCosts} ({detail.finalCostsDescription})</p>
      <p><strong>Seals:</strong> Old: {detail.oldSeal} New: {detail.newSeal}</p>
      <p><strong>DGD:</strong> Incorrect: {String(detail.dgdIncorrect)} | Un/Mis Declared: {detail.unMisDeclared} | Remarks: {detail.dgdRemarks}</p>
      {tab==='contents' && (
        <div>
          <h4>Contents</h4>
          <table style={{ width:'100%', fontSize:'0.75rem' }}>
            <thead><tr><th>UN</th><th>PkgType</th><th>Unit</th><th>PkgAmt</th><th>Qty</th><th>LQ</th><th>Req</th></tr></thead>
            <tbody>
              {contents.map(c=> <tr key={c.inspectionResultContentId}>
                <td>{c.un?.number}</td><td>{c.packageType?.name}</td><td>{c.unit?.name}</td><td>{c.packageAmount}</td><td>{c.quantity}</td><td>{c.limitedQuantity?'Y':''}</td><td>{c.required?'Y':''}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
      )}
      {tab==='files' && (
        <div>
          <h4>Files</h4>
          <table style={{ width:'100%', fontSize:'0.75rem' }}>
            <thead><tr><th>Name</th><th>Preview</th><th>Medium</th></tr></thead>
            <tbody>{files.map(f=> <tr key={f.inspectionResultFileId}><td>{f.fileName}</td><td><a href={f.filePreviewUri} target='_blank'>preview</a></td><td><a href={f.fileMediumSizeUri} target='_blank'>medium</a></td></tr>)}</tbody>
          </table>
        </div>
      )}
      {tab==='activities' && (
        <div>
          <h4>Activities</h4>
          <table style={{ width:'100%', fontSize:'0.75rem' }}>
            <thead><tr><th>Type</th><th>Date</th><th>Amount</th><th>Remarks</th></tr></thead>
            <tbody>{activities.map(a=> <tr key={a.activityId}><td>{a.activityType?.name}</td><td>{String(a.date).substring(0,10)}</td><td>{a.amount}</td><td>{a.remarks}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
