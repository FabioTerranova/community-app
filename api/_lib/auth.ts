/**
 * Zustandsloses Login per signierten Tokens (HMAC-SHA256) — kein Sessions-Speicher.
 *
 * Token-Typen:
 *  - 'session' : Sitzungs-Token (~1 Jahr), im Browser (localStorage) gehalten.
 *  - 'login'   : (historisch) — der Login laeuft jetzt ueber 6-stellige Codes,
 *                siehe makeLoginCode/checkLoginCode weiter unten.
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

/**
 * Login-Code (6-stellig) — zustandslos aus E-Mail + Zeitfenster abgeleitet (TOTP-artig).
 * Kein Server-Speicher noetig: derselbe Code laesst sich beim Pruefen neu berechnen.
 * Gueltig fuers aktuelle + vorherige Fenster -> ~10–20 Minuten.
 */
const CODE_STEP_SECONDS = 600; // 10-Minuten-Fenster

function codeForStep(email: string, step: number): string {
  const mac = createHmac('sha256', secret()).update(`code:${email}:${step}`).digest();
  const num = mac.readUInt32BE(0) % 1_000_000;
  return num.toString().padStart(6, '0');
}

/** Aktuellen Login-Code fuer eine E-Mail erzeugen (zum Versenden). */
export function makeLoginCode(email: string): string {
  return codeForStep(email, Math.floor(Date.now() / 1000 / CODE_STEP_SECONDS));
}

/** Prueft den eingegebenen Code gegen aktuelles + vorheriges Fenster. */
export function checkLoginCode(email: string, code: string): boolean {
  const c = String(code || '').replace(/\D/g, '');
  if (c.length !== 6) return false;
  const step = Math.floor(Date.now() / 1000 / CODE_STEP_SECONDS);
  for (const s of [step, step - 1]) {
    const expected = codeForStep(email, s);
    const a = new Uint8Array(Buffer.from(c));
    const b = new Uint8Array(Buffer.from(expected));
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}
