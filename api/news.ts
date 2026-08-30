import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * News-Versand-Endpunkt (STUB — Grundgeruest, Umsetzung nach dem Design).
 *
 * Geplanter Vertrag:
 *   POST /api/news {subject, body, audience?} -> { ok, sent }
 *   Versand via Resend an die (aktiven) Mitglieder. Solange die Absender-Domain
 *   nicht verifiziert ist: nur an die eigene Adresse (Test-Modus).
 *
 * Env: RESEND_API_KEY, NEWS_FROM. Muster wie api/lead.ts in zenit-alpine-app:
 *   const resend = new Resend(process.env.RESEND_API_KEY);
 *   await resend.emails.send({ from: process.env.NEWS_FROM, to, subject, html });
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({
    ok: false,
    endpoint: 'news',
    method: req.method,
    reason: 'Noch nicht implementiert — Grundgeruest steht, Umsetzung nach dem Design.',
  });
}
