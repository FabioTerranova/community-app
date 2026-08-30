import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Termine-Endpunkt (STUB — Grundgeruest, Umsetzung nach dem Design).
 *
 * Geplanter Vertrag:
 *   GET  /api/events                 -> CommunityEvent[]  (aus Notion "Termine")
 *   POST /api/events {title,date,...}-> CommunityEvent     (neuen Termin anlegen)
 *
 * Umsetzung dann via api/_lib/notion.ts:
 *   resolveDatabaseId(token, /termin|event/i, process.env.NOTION_EVENTS_DB_ID)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({
    ok: false,
    endpoint: 'events',
    method: req.method,
    reason: 'Noch nicht implementiert — Grundgeruest steht, Umsetzung nach dem Design.',
  });
}
