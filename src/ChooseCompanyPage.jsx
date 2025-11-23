import { useEffect, useMemo, useState } from 'react';
import { userManager } from './oidc';
const BACKEND_BASE = (import.meta?.env?.VITE_BACKEND_BASE_URL) || 'http://localhost:3100';

export default function ChooseCompanyPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [companies, setCompanies] = useState([]);
  const [inspectionCompanyId, setInspectionCompanyId] = useState('');
  const [error, setError] = useState('');
  const returnTo = params.get('returnTo') ? decodeURIComponent(params.get('returnTo')) : '/api-docs';

  useEffect(() => {
    const loginToken = sessionStorage.getItem('loginToken');
    if (!loginToken) {
      setError('Missing login token; please sign in again');
      return;
    }
    fetch(`${BACKEND_BASE}/companies`, { headers: { 'X-Login-Token': loginToken } })
      .then(async r => { if(!r.ok) { const d = await r.json().catch(()=>({})); throw new Error(d.error || 'Failed to load companies'); } return r.json(); })
      .then(setCompanies)
      .catch(e => setError(e.message || 'Failed to load companies'));
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      if (!inspectionCompanyId) {
        setError('Please select a company');
        return;
      }
      // Persist selection server side so subsequent /oauth2/authorize includes it
      const loginToken = sessionStorage.getItem('loginToken');
      if (!loginToken) {
        setError('Missing login token; please sign in again');
        return;
      }
      const res = await fetch(`${BACKEND_BASE}/select-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Login-Token': loginToken },
        body: JSON.stringify({ inspectionCompanyId: Number(inspectionCompanyId) })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || data.message || 'Failed to select company');
        return;
      }
      // Restart OIDC authorize including selection using library (ensures state & PKCE flow management)
      await userManager.clearStaleState().catch(()=>{});
      const state = { chosenCompany: Number(inspectionCompanyId), ts: Date.now() };
      // Custom extra parameters propagate company & login token
      await userManager.signinRedirect({ extraQueryParams: { inspectionCompanyId: String(inspectionCompanyId), loginToken }, state }).catch(err => {
        console.error('[ChooseCompany] signinRedirect failed', err);
        throw err;
      });
    } catch (err) {
      setError(err.message || 'Submit error');
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '3rem auto', fontFamily: 'system-ui, Arial, sans-serif' }}>
      <h1>Select Inspection Company</h1>
      {error ? <div style={{ color: '#b00020', background: '#fde7eb', padding: '.5rem .75rem', borderRadius: 6, marginBottom: 12 }}>{error}</div> : null}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          <div>Company</div>
          <select value={inspectionCompanyId} onChange={e => setInspectionCompanyId(e.target.value)} required>
            <option value="" disabled>Pick a company…</option>
            {companies.map(c => (
              <option key={c.InspectionCompanyId} value={c.InspectionCompanyId}>{c.Name}</option>
            ))}
          </select>
        </label>
        <button type="submit" style={{ padding: '.6rem .9rem', background: '#2563eb', color: '#fff', border: 0, borderRadius: 6 }}>Continue</button>
      </form>
    </div>
  );
}
