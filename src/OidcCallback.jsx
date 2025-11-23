import { useEffect } from 'react';
import { userManager } from './oidc';

export default function OidcCallback(){
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await userManager.signinRedirectCallback();
        if (!cancelled) {
          window.history.replaceState({}, document.title, '/');
        }
      } catch (e) {
        console.error('[OidcCallback] signinRedirectCallback error', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  return <div style={{ padding: '2rem', fontFamily: 'system-ui, Arial, sans-serif' }}>Completing sign in…</div>;
}
