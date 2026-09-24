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

/** Kommagetrennte Namen -> Personen-Array ("Anna, Ben" -> ["Anna","Ben"]). */
function people(text: string): string[] {
  return text
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Baut die Dienste-Liste aus den beiden Spalten (leere Dienste werden weggelassen). */
function dutiesFrom(vorbereitung: string, snacks: string) {
  const duties: { role: string; people: string[] }[] = [];
  if (vorbereitung.trim()) duties.push({ role: 'Vorbereitung', people: people(vorbereitung) });
  if (snacks.trim()) duties.push({ role: 'Snacks', people: people(snacks) });
  return duties.length ? duties : undefined;
}

/**
 * Termine:
 *   GET  /api/events                       -> { ok, events: CommunityEvent[] } (nach Datum sortiert)
 *   POST /api/events {title,date,location?,notes?,vorbereitung?,snacks?} -> { ok, event: CommunityEvent }
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
        duties: dutiesFrom(read.text(r.properties?.Vorbereitung), read.text(r.properties?.Snacks)),
      }));
      return res.status(200).json({ ok: true, events });
    }

    if (req.method === 'POST') {
      const { title, date, location, notes, vorbereitung, snacks } = (req.body || {}) as {
        title?: string;
        date?: string;
        location?: string;
        notes?: string;
        vorbereitung?: string;
        snacks?: string;
      };
      if (!title || !date) return res.status(400).json({ ok: false, reason: 'title und date noetig.' });
      const page = await createPage(token, dbId, {
        [titleProp]: prop.title(title),
        Datum: prop.date(date),
        Ort: prop.text(location || ''),
        Notizen: prop.text(notes || ''),
        Vorbereitung: prop.text(vorbereitung || ''),
        Snacks: prop.text(snacks || ''),
      });
      return res.status(200).json({
        ok: true,
        event: {
          id: page.id,
          title,
          date,
          location,
          notes,
          duties: dutiesFrom(vorbereitung || '', snacks || ''),
        },
      });
    }

    return res.status(405).json({ ok: false, reason: 'Method not allowed.' });
  } catch (err: any) {
    return res.status(500).json({ ok: false, reason: err?.message || 'Fehler' });
  }
}
