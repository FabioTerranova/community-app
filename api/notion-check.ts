import type { VercelRequest, VercelResponse } from '@vercel/node';
import { notionDiagnostics } from './_lib/notion';

/**
 * Diagnose-Endpunkt: zeigt, ob NOTION_TOKEN gesetzt ist und welche Datenbanken
 * die Integration sieht. Aufruf im Browser: /api/notion-check
 * (Analog zu zenit-alpine-app /api/notion-check.)
 */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return res.status(200).json({ ok: false, reason: 'NOTION_TOKEN fehlt (bei Vercel als Env-Var setzen).' });
  }
  try {
    const databases = await notionDiagnostics(token);
    return res.status(200).json({ ok: true, count: databases.length, databases });
  } catch (err: any) {
    return res.status(200).json({ ok: false, reason: err?.message || 'Fehler' });
  }
}
