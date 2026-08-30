import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import { ensureProperties, queryDatabase, read, resolveDatabaseId } from './_lib/notion';
import { MEMBERS, envId } from './_lib/schema';

/**
 * News an die Community versenden (Resend):
 *   POST /api/news {subject, body, audience?} -> { ok, sent, recipients }
 *
 * Empfaenger = aktive Mitglieder mit E-Mail (aus der Notion-Mitglieder-DB).
 * SICHERHEIT/Test: solange die Resend-Absender-Domain nicht verifiziert ist,
 * NEWS_TEST_TO setzen — dann geht ALLES nur an diese eine Adresse (Testmodus).
 *
 * Env: RESEND_API_KEY, NEWS_FROM (Default onboarding@resend.dev), NEWS_TEST_TO (optional).
 */
const escapeHtml = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, reason: 'Method not allowed.' });

  const notionToken = process.env.NOTION_TOKEN;
  const resendKey = process.env.RESEND_API_KEY;
  if (!notionToken) return res.status(500).json({ ok: false, reason: 'NOTION_TOKEN fehlt.' });
  if (!resendKey) return res.status(500).json({ ok: false, reason: 'RESEND_API_KEY fehlt.' });

  const { subject, body } = (req.body || {}) as { subject?: string; body?: string; audience?: string };
  if (!subject || !body) return res.status(400).json({ ok: false, reason: 'subject und body noetig.' });

  try {
    // Empfaenger aus Notion (aktive Mitglieder mit E-Mail).
    const dbId = await resolveDatabaseId(notionToken, MEMBERS.match, envId(MEMBERS));
    await ensureProperties(notionToken, dbId, MEMBERS.props);
    const rows = await queryDatabase(notionToken, dbId);
    let recipients = rows
      .filter((r) => (r.properties?.Aktiv ? read.checkbox(r.properties.Aktiv) : true))
      .map((r) => read.email(r.properties?.['E-Mail']))
      .filter((e): e is string => !!e);

    // Testmodus: alles nur an eine Adresse.
    const testTo = process.env.NEWS_TEST_TO;
    if (testTo) recipients = recipients.length ? [testTo] : [testTo];
    recipients = Array.from(new Set(recipients));
    if (!recipients.length) return res.status(200).json({ ok: true, sent: 0, recipients: [], note: 'Keine Empfaenger.' });

    const resend = new Resend(resendKey);
    const from = process.env.NEWS_FROM || 'onboarding@resend.dev';
    const html = `<div style="font-family:sans-serif;line-height:1.5">${escapeHtml(body).replace(/\n/g, '<br/>')}</div>`;

    // Resend: max. 50 Empfaenger pro Nachricht -> in Bloecke aufteilen (bcc).
    let sent = 0;
    for (const group of chunk(recipients, 50)) {
      await resend.emails.send({ from, to: from, bcc: group, subject, html });
      sent += group.length;
    }

    return res.status(200).json({ ok: true, sent, recipients: testTo ? recipients : sent });
  } catch (err: any) {
    return res.status(500).json({ ok: false, reason: err?.message || 'Fehler' });
  }
}
