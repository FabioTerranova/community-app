/**
 * Login-Client (Magic-Link). Spricht NUR `/api/auth`.
 * Session-Token liegt im localStorage (nur Web). Auf Nativ ohne localStorage
 * bleibt man ausgeloggt (Login-Flow ist aktuell fuer Web/PWA gedacht).
 */
const API_BASE = process.env.EXPO_PUBLIC_API_BASE || '';
const SESSION_KEY = 'juha_session';

export interface AuthMember {
  id: string;
  name: string;
  email?: string;
  active?: boolean;
  emoji?: string;
  admin?: boolean;
}

async function post(action: string, payload: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${API_BASE}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) throw new Error(data?.reason || `HTTP ${res.status}`);
  return data;
}

function getStored(): string | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(SESSION_KEY) : null;
  } catch {
    return null;
  }
}
function store(session: string) {
  try {
    localStorage.setItem(SESSION_KEY, session);
  } catch {
    /* ignore */
  }
}
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

/** Login-Link per E-Mail anfordern. */
export async function requestLogin(email: string): Promise<void> {
  await post('request', { email });
}

/** Falls `?token=` in der URL steht: einloesen, Session speichern, URL saeubern. */
export async function consumeMagicLink(): Promise<AuthMember | null> {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const token = url.searchParams.get('token');
  if (!token) return null;
  const clean = () => {
    url.searchParams.delete('token');
    window.history.replaceState({}, '', url.pathname + url.search + url.hash);
  };
  try {
    const { session, member } = await post('verify', { token });
    store(session);
    clean();
    return member as AuthMember;
  } catch (e) {
    clean();
    throw e;
  }
}

/** Bestehende Session pruefen -> Member oder null. */
export async function restoreSession(): Promise<AuthMember | null> {
  const session = getStored();
  if (!session) return null;
  try {
    const { member } = await post('me', { session });
    return member as AuthMember;
  } catch {
    clearSession();
    return null;
  }
}

export function logout() {
  clearSession();
}
