import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';
import { PUSH, envId } from './_lib/schema';
import {
  resolveDatabaseId,
  ensureProperties,
  queryDatabase,
  updatePage,
  notionFetch,
  read,
} from './_lib/notion';

/**
 * Versand der Termin-Erinnerungen (~2h vor Beginn) — von einem EXTERNEN Cron
 * (z.B. cron-job.org, alle ~15 min) aufgerufen:
 *
 *   GET /api/push-cron?key=<CRON_SECRET>
 *
 * Sucht nicht-gesendete Abos, deren Termin in den naechsten 2h startet, schickt
 * Web-Push und markiert sie als gesendet (kein Doppelversand). Ungueltige/abgelaufene
 * Abos (404/410) werden archiviert.
 *
 * Noetige Env-Vars: NOTION_TOKEN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, CRON_SECRET
 * (optional VAPID_SUBJECT, Default "mailto:admin@example.com").
 */

const LEAD_MS = 2 * 60 * 60 * 1000; // 2 Stunden Vorlauf
const DEFAULT_HOUR = 19; // Termine ohne Uhrzeit: Start als 19:00 annehmen

/** Termin-Beginn in ms. Voller Zeitstempel wird genutzt, reines Datum -> DEFAULT_HOUR. */
function eventStartMs(dateStr: string): number {
  if (!dateStr) return NaN;
  if (/T\d{2}:\d{2}/.test(dateStr)) return Date.parse(dateStr);
  return Date.parse(`${dateStr}T${String(DEFAULT_HOUR).padStart(2, '0')}:00:00`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const key = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key;
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
    return res.status(401).json({ ok: false, reason: 'unauthorized' });
  }

  const token = process.env.NOTION_TOKEN;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!token || !pub || !priv) {
    return res.status(500).json({ ok: false, reason: 'Env fehlt (NOTION_TOKEN / VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY)' });
  }

  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@example.com', pub, priv);

  const dbId = await resolveDatabaseId(token, PUSH.match, envId(PUSH));
  await ensureProperties(token, dbId, PUSH.props);

  const rows = await queryDatabase(token, dbId, {
    filter: { property: 'Gesendet', checkbox: { equals: false } },
    page_size: 100,
  });

  const now = Date.now();
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const r of rows) {
    const p = r.properties || {};
    const startMs = eventStartMs(read.date(p['Termin-Datum']));
    if (!Number.isFinite(startMs)) {
      skipped++;
      continue;
    }
    const until = startMs - now;
    // Nur wenn der Termin innerhalb der naechsten 2h liegt und noch nicht begonnen hat.
    if (until > LEAD_MS || until <= 0) {
      skipped++;
      continue;
    }

    const endpoint = read.text(p['Endpoint']);
    const p256dh = read.text(p['P256dh']);
    const auth = read.text(p['Auth']);
    const eventTitle = read.text(p['Termin']) || 'Termin';
    if (!endpoint || !p256dh || !auth) {
      skipped++;
      continue;
    }

    const mins = Math.round(until / 60000);
    const whenText = mins >= 90 ? 'in ca. 2 Stunden' : `in ca. ${Math.max(1, Math.round(mins / 5) * 5)} Minuten`;
    const payload = JSON.stringify({
      title: 'JUHA · bald geht’s los',
      body: `${eventTitle} startet ${whenText}. Bis gleich! 🕊️`,
      url: '/',
    });

    try {
      await webpush.sendNotification({ endpoint, keys: { p256dh, auth } }, payload);
      await updatePage(token, r.id, { Gesendet: { checkbox: true } });
      sent++;
    } catch (e: any) {
      failed++;
      const code = e?.statusCode;
      if (code === 404 || code === 410) {
        // Abo abgelaufen/abbestellt -> aufraeumen.
        try {
          await notionFetch(`/pages/${r.id}`, token, {
            method: 'PATCH',
            body: JSON.stringify({ archived: true }),
          });
        } catch {
          /* ignore */
        }
      }
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({ ok: true, checked: rows.length, sent, failed, skipped });
}
