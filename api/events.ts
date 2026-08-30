import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createPage,
  ensureProperties,
  prop,
  queryDatabase,
  read,
  resolveDatabaseId,
} from './_lib/notion';
import { EVENTS, envId } from './_lib/schema';

/**
 * Termine:
 *   GET  /api/events                       -> { ok, events: CommunityEvent[] } (nach Datum sortiert)
 *   POST /api/events {title,date,location?,notes?} -> { ok, event: CommunityEvent }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ ok: false, reason: 'NOTION_TOKEN fehlt.' });

  try {
    const dbId = await resolveDatabaseId(token, EVENTS.match, envId(EVENTS));
    const titleProp = await ensureProperties(token, dbId, EVENTS.props);

    if (req.method === 'GET') {
      const rows = await queryDatabase(token, dbId, {
        sorts: [{ property: 'Datum', direction: 'ascending' }],
      });
      const events = rows.map((r) => ({
        id: r.id,
        title: read.titleText(r.properties?.[titleProp]),
        date: read.date(r.properties?.Datum),
        location: read.text(r.properties?.Ort) || undefined,
        notes: read.text(r.properties?.Notizen) || undefined,
      }));
      return res.status(200).json({ ok: true, events });
    }

    if (req.method === 'POST') {
      const { title, date, location, notes } = (req.body || {}) as {
        title?: string;
        date?: string;
        location?: string;
        notes?: string;
      };
      if (!title || !date) return res.status(400).json({ ok: false, reason: 'title und date noetig.' });
      const page = await createPage(token, dbId, {
        [titleProp]: prop.title(title),
        Datum: prop.date(date),
        Ort: prop.text(location || ''),
        Notizen: prop.text(notes || ''),
      });
      return res.status(200).json({ ok: true, event: { id: page.id, title, date, location, notes } });
    }

    return res.status(405).json({ ok: false, reason: 'Method not allowed.' });
  } catch (err: any) {
    return res.status(500).json({ ok: false, reason: err?.message || 'Fehler' });
  }
}
