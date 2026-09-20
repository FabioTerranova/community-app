import type { VercelRequest, VercelResponse } from '@vercel/node';
import { PUSH, envId } from './_lib/schema';
import {
  resolveDatabaseId,
  ensureProperties,
  queryDatabase,
  createPage,
  updatePage,
  notionFetch,
  prop,
} from './_lib/notion';

/**
 * Web-Push — Abo-Verwaltung fuer Termin-Erinnerungen.
 *
 *   GET  /api/push                        -> { ok, publicKey }   (VAPID-Public-Key fuer den Client)
 *   POST /api/push { action:'subscribe',   memberId, memberName?, eventId, eventTitle?, eventDate?, subscription }
 *   POST /api/push { action:'unsubscribe', eventId, subscription }
 *
 * Die Abos liegen in einer eigenen Notion-DB (siehe schema.PUSH). Der eigentliche
 * Versand passiert zeitgesteuert in `api/push-cron.ts` (~2h vor Beginn).
 */

function token(): string {
  const t = process.env.NOTION_TOKEN;
  if (!t) throw new Error('NOTION_TOKEN fehlt');
  return t;
}

async function pushDb(t: string): Promise<{ dbId: string; titleProp: string }> {
  const dbId = await resolveDatabaseId(t, PUSH.match, envId(PUSH));
  const titleProp = await ensureProperties(t, dbId, PUSH.props);
  return { dbId, titleProp };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      // Kurzer Cache: der Public-Key aendert sich praktisch nie.
      res.setHeader('Cache-Control', 's-maxage=3600');
      return res.status(200).json({ ok: true, publicKey: process.env.VAPID_PUBLIC_KEY || '' });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ ok: false, reason: 'Method not allowed' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const { action, memberId, memberName, eventId, eventTitle, eventDate, subscription } = body;
    const endpoint: string | undefined = subscription?.endpoint;
    if (!eventId || !endpoint) {
      return res.status(400).json({ ok: false, reason: 'eventId und subscription.endpoint noetig' });
    }

    const t = token();
    const { dbId, titleProp } = await pushDb(t);

    // Vorhandene Zeile fuer (Termin + Geraet-Endpoint) finden.
    const rows = await queryDatabase(t, dbId, {
      filter: {
        and: [
          { property: 'Termin-ID', rich_text: { equals: String(eventId) } },
          { property: 'Endpoint', rich_text: { equals: endpoint } },
        ],
      },
    });

    if (action === 'unsubscribe') {
      for (const r of rows) {
        await notionFetch(`/pages/${r.id}`, t, {
          method: 'PATCH',
          body: JSON.stringify({ archived: true }),
        });
      }
      return res.status(200).json({ ok: true, removed: rows.length });
    }

    // action === 'subscribe' (Default)
    const keys = subscription?.keys || {};
    const properties = {
      [titleProp]: prop.title(`${memberName || memberId || 'Mitglied'} · ${eventTitle || eventId}`),
      'Mitglied-ID': prop.text(memberId || ''),
      Mitglied: prop.text(memberName || ''),
      'Termin-ID': prop.text(String(eventId)),
      Termin: prop.text(eventTitle || ''),
      'Termin-Datum': prop.date(eventDate || undefined),
      Endpoint: prop.text(endpoint),
      P256dh: prop.text(keys.p256dh || ''),
      Auth: prop.text(keys.auth || ''),
      Gesendet: prop.checkbox(false),
    };

    if (rows.length) {
      await updatePage(t, rows[0].id, properties);
      return res.status(200).json({ ok: true, updated: true });
    }
    await createPage(t, dbId, properties);
    return res.status(200).json({ ok: true, created: true });
  } catch (e: any) {
    return res.status(500).json({ ok: false, reason: e?.message || 'Fehler' });
  }
}
