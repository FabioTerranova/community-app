/**
 * Zustandsloses Login per signierten Tokens (HMAC-SHA256) — kein Sessions-Speicher.
 *
 * Zwei Token-Typen:
 *  - 'login'   : kurzer Magic-Link-Token (~15 min), per E-Mail verschickt.
 *  - 'session' : laengerer Sitzungs-Token (~30 Tage), im Browser (localStorage) gehalten.
 *
 * Env: AUTH_SECRET (langes Geheimnis; bei Vercel setzen).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error('AUTH_SECRET fehlt (Env-Var setzen).');
  return s;
}

export interface TokenPayload {
  /** Typ des Tokens. */
  p: 'login' | 'session';
  /** E-Mail (lowercase). */
  e: string;
  /** Notion-Mitglied-ID (nur bei 'session'). */
  m?: string;
  /** Ablauf als Unix-Sekunden. */
  exp: number;
}

export function signToken(payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token: string, expect: 'login' | 'session'): TokenPayload {
  const [body, sig] = String(token || '').split('.');
  if (!body || !sig) throw new Error('Token ungueltig.');
  const expected = createHmac('sha256', secret()).update(body).digest('base64url');
  const a = new Uint8Array(Buffer.from(sig));
  const b = new Uint8Array(Buffer.from(expected));
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error('Token-Signatur ungueltig.');
  let payload: TokenPayload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch {
    throw new Error('Token-Inhalt ungueltig.');
  }
  if (payload.p !== expect) throw new Error('Falscher Token-Typ.');
  if (!payload.exp || payload.exp * 1000 < Date.now()) throw new Error('Token abgelaufen.');
  return payload;
}

/** Unix-Sekunden in `seconds` Sekunden ab jetzt. */
export function nowPlus(seconds: number): number {
  return Math.floor(Date.now() / 1000) + seconds;
}
