import { UserManager } from 'oidc-client-ts';

const BACKEND_BASE = (import.meta?.env?.VITE_BACKEND_BASE_URL) || 'http://localhost:3100';
const FRONTEND_BASE = (import.meta?.env?.VITE_FRONTEND_BASE_URL) || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');
const CALLBACK_URL = `${FRONTEND_BASE.replace(/\/$/, '')}/auth/callback`;

export const oidcConfig = {
  authority: BACKEND_BASE,
  metadataUrl: `${BACKEND_BASE}/oauth2config`,
  client_id: 'psmobile-client-12345',
  redirect_uri: CALLBACK_URL,
  post_logout_redirect_uri: FRONTEND_BASE,
  response_type: 'code',
  scope: 'openid profile email read write'
};

export const userManager = new UserManager(oidcConfig);

export function extractInspectionCompanyId(user) {
  if (!user) return null;
  if (user.profile && user.profile.inspectionCompanyId != null) return user.profile.inspectionCompanyId;
  if (user.id_token) {
    try {
      const [, payload] = user.id_token.split('.');
      const parsed = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return parsed.inspectionCompanyId ?? null;
    } catch {
      return null;
    }
  }
  return null;
}
