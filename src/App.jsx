import React from 'react';
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom';
import RemoteInspectionsPage from './RemoteInspectionsPage.jsx';
import InspectionResultDetail from './InspectionResultDetail.jsx';
function InspectionDetailRouteWrapper(){
  const { id } = useParams();
  const { token } = React.useContext(AuthContext);
  return <InspectionResultDetail id={id} token={token} />;
}
import { useEffect, useState, useRef } from 'react';
import { userManager, extractInspectionCompanyId } from './oidc';
import { AuthContext } from './AuthContext';
import LoginPage from './LoginPage.jsx';
import ChooseCompanyPage from './ChooseCompanyPage.jsx';
import OidcCallback from './OidcCallback.jsx';

function App() {
  const [user, setUser] = useState(null);
  const handledCallbackRef = useRef(false);
  // Derived values declared early so effects can use them safely
  const token = user && user.access_token;
  const inspectionCompanyId = extractInspectionCompanyId(user);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = await userManager.getUser();
      if (cancelled) return;
      const path = window.location.pathname;
      const isPublic = path === '/login' || path === '/choose-company' || path === '/auth/callback';
      const params = new URLSearchParams(window.location.search);
      const hasCode = params.get('code');
      if (hasCode && !handledCallbackRef.current) {
        handledCallbackRef.current = true;
        try {
          const u2 = await userManager.signinRedirectCallback();
          if (!cancelled) {
            setUser(u2);
            window.history.replaceState({}, document.title, '/');
          }
        } catch {}
        return;
      }
      if ((!existing || existing.expired) && !isPublic) {
        console.log('[Auth] No existing user; awaiting manual login flow.');
        // Do NOT auto redirect immediately; show login so user sees something.
        setUser(null);
      } else {
        console.log('[Auth] Loaded existing user:', existing ? existing.profile?.sub : 'none');
        setUser(existing);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function onLoaded(u){ setUser(u); }
    function onUnloaded(){ setUser(null); }
    userManager.events.addUserLoaded(onLoaded);
    userManager.events.addUserUnloaded(onUnloaded);
    return () => {
      userManager.events.removeUserLoaded(onLoaded);
      userManager.events.removeUserUnloaded(onUnloaded);
    };
  }, []);

  // Redirect to company chooser if authenticated but company not chosen
  useEffect(() => {
    if (token) {
      const pathNow = window.location.pathname;
      if (inspectionCompanyId == null && pathNow !== '/choose-company' && !pathNow.startsWith('/auth')) {
        const returnTo = encodeURIComponent(pathNow + window.location.search);
        window.location.replace(`/choose-company?returnTo=${returnTo}`);
      }
    }
  }, [token, inspectionCompanyId]);

  const logout = () => { userManager.signoutRedirect(); setUser(null); };
  const path = window.location.pathname;
  const isPublic = path === '/login' || path === '/choose-company' || path === '/auth/callback';
  console.log('[App] render', { path, hasUser: !!user, tokenPresent: !!token, inspectionCompanyId });

  const mountedIndicator = <div data-app-mounted style={{ display:'none' }}>mounted</div>;
  return (
    <AuthContext.Provider value={{ token, inspectionCompanyId, user }}>
      <BrowserRouter>
        <header style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link to="/" style={{ fontWeight: 600, textDecoration: 'none' }}>PortSupervisor</Link>
            {inspectionCompanyId != null ? <span>Company: <strong>{inspectionCompanyId}</strong></span> : null}
            {token ? (
              <Link to={`/choose-company?returnTo=${encodeURIComponent(path)}`} style={{ textDecoration: 'underline', color: '#2563eb' }}>Switch Company</Link>
            ) : null}
          </div>
          {token && !path.startsWith('/wizard') ? <button onClick={logout} style={{ background: 'transparent', border: '1px solid #ccc', padding: '.4rem .75rem', borderRadius: 6 }}>Logout</button> : null}
        </header>
        {!path.startsWith('/wizard') && token ? (
          <nav style={{ padding: '.5rem 1rem', display: 'flex', gap: '1rem' }}>
            <Link to="/" style={{ color: '#2563eb' }}>Inspections</Link>
          </nav>
        ) : null}
        <main style={{ padding: '1rem' }}>
          {mountedIndicator}
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/choose-company" element={<ChooseCompanyPage />} />
            <Route path="/auth/callback" element={<OidcCallback />} />
            <Route path="/" element={token ? <RemoteInspectionsPage /> : <LoginPage />} />
            <Route path="/inspections" element={token ? <RemoteInspectionsPage /> : <LoginPage />} />
            <Route path="/inspections/:id" element={token ? <InspectionDetailRouteWrapper /> : <LoginPage />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;
