import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Mitglieder-Endpunkt (STUB — Grundgeruest, Umsetzung nach dem Design).
 *
 * Geplanter Vertrag:
 *   GET  /api/members            -> Member[]              (Liste aus Notion "Mitglieder")
 *   POST /api/members {name,...} -> Member                (neues Mitglied anlegen)
 *
 * Umsetzung dann via api/_lib/notion.ts:
 *   resolveDatabaseId(token, /mitglied|member/i, process.env.NOTION_MEMBERS_DB_ID)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(501).json({
    ok: false,
    endpoint: 'members',
    method: req.method,
    reason: 'Noch nicht implementiert — Grundgeruest steht, Umsetzung nach dem Design.',
  });
}
