import { useEffect, useMemo, useState } from 'react';
import { userManager } from './oidc';
const BACKEND_BASE = (import.meta?.env?.VITE_BACKEND_BASE_URL) || 'http://localhost:3100';

export default function LoginPage() {
  useEffect(()=> { console.log('[LoginPage] mounted'); }, []);
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const returnTo = params.get('returnTo') ? decodeURIComponent(params.get('returnTo')) : '/api-docs';

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const body = new URLSearchParams();
      body.set('username', username);
      body.set('password', password);
      const res = await fetch(`${BACKEND_BASE}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' },
        body: body.toString()
      });
      const data = await res.json();
      if (res.ok && data && data.ok) {
        if (!data.loginToken) {
          setError('Missing login token from server');
          return;
        }
        sessionStorage.setItem('loginToken', data.loginToken);
        // If company not selected yet, go to chooser page
        if (!data.companySelected) {
          window.location.href = `/choose-company`;
          return;
        }
        // Company already selected -> initiate OIDC authorize via library (ensures state handling)
        await userManager.clearStaleState().catch(()=>{});
        const state = { preChosenCompany: true, ts: Date.now() };
        await userManager.signinRedirect({ extraQueryParams: { loginToken: data.loginToken }, state }).catch(err => {
          console.error('[LoginPage] signinRedirect failed', err);
          throw err;
        });
      } else {
        setError((data && (data.error || data.message)) || 'Login failed');
      }
    } catch (err) {
      setError(err.message || 'Login error');
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '3rem auto', fontFamily: 'system-ui, Arial, sans-serif' }}>
      <h1>Sign in</h1>
      {error ? <div style={{ color: '#b00020', background: '#fde7eb', padding: '.5rem .75rem', borderRadius: 6, marginBottom: 12 }}>{error}</div> : null}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          <div>Username</div>
          <input value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required />
        </label>
        <label>
          <div>Password</div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        <button type="submit" style={{ padding: '.6rem .9rem', background: '#2563eb', color: '#fff', border: 0, borderRadius: 6 }}>Sign in</button>
      </form>
    </div>
  );
}
