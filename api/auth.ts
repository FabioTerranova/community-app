import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';
import {
  createPage,
  ensureProperties,
  notionFetch,
  prop,
  queryDatabase,
  read,
  resolveDatabaseId,
  updatePage,
} from './_lib/notion';
import { MEMBERS, envId } from './_lib/schema';
import { checkLoginCode, makeLoginCode, nowPlus, signToken, verifyToken } from './_lib/auth';

/**
 * Passwortloses Login per 6-stelligem Code (kein Link — funktioniert auch in der
 * installierten iPhone-PWA, die einen eigenen Speicher getrennt von Safari hat):
 *   POST /api/auth {action:'request', email, name?} -> schickt einen Code per E-Mail
 *   POST /api/auth {action:'verify',  email, code}  -> { ok, session, member }
 *   POST /api/auth {action:'me',      session}      -> { ok, member }
 *
 * Env: NOTION_TOKEN, RESEND_API_KEY, NEWS_FROM, AUTH_SECRET.
 */

const escapeHtml = (s: unknown): string =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

async function membersDb(token: string): Promise<{ dbId: string; titleProp: string }> {
  const dbId = await resolveDatabaseId(token, MEMBERS.match, envId(MEMBERS));
  const titleProp = await ensureProperties(token, dbId, MEMBERS.props);
  return { dbId, titleProp };
}

function toMember(row: any, titleProp: string) {
  const p = row.properties || {};
  return {
    id: row.id,
    name: read.titleText(p[titleProp]) || '',
    email: read.email(p['E-Mail']) || undefined,
    active: p.Aktiv ? read.checkbox(p.Aktiv) : true,
    emoji: read.text(p['Emoji']) || undefined,
    admin: p.Admin ? read.checkbox(p.Admin) : false,
  };
}

async function findByEmail(token: string, dbId: string, titleProp: string, email: string) {
  const rows = await queryDatabase(token, dbId, {
    filter: { property: 'E-Mail', email: { equals: email } },
    page_size: 1,
  });
  return rows.length ? toMember(rows[0], titleProp) : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, reason: 'Method not allowed.' });
  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ ok: false, reason: 'NOTION_TOKEN fehlt.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const action = body.action;

  try {
    if (action === 'request') {
      const email = String(body.email || '').trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return res.status(400).json({ ok: false, reason: 'Bitte eine gueltige E-Mail eingeben.' });
      }
      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) return res.status(500).json({ ok: false, reason: 'RESEND_API_KEY fehlt.' });

      const providedName = String(body.name || '').trim();
      const { dbId, titleProp } = await membersDb(token);
      let member = await findByEmail(token, dbId, titleProp, email);
      if (!member) {
        // Selbstregistrierung: Name aus der Eingabe (Fallback: Teil vor dem @).
        const finalName = providedName || email.split('@')[0];
        const page = await createPage(token, dbId, {
          [titleProp]: prop.title(finalName),
          'E-Mail': prop.email(email),
          Aktiv: prop.checkbox(true),
        });
        member = { id: page.id, name: finalName, email, active: true, emoji: undefined, admin: false };
      } else if (providedName && providedName !== member.name) {
        // Bestehendes Mitglied: Namen aktualisieren, wenn ein neuer angegeben wurde.
        await updatePage(token, member.id, { [titleProp]: prop.title(providedName) });
        member = { ...member, name: providedName };
      }

      const code = makeLoginCode(email);
      // Freundlicher Absender-Name wirkt vertrauenswuerdiger (weniger Spam-Verdacht).
      // Nur ergaenzen, wenn NEWS_FROM nicht schon einen Anzeigenamen enthaelt.
      const fromRaw = process.env.NEWS_FROM || 'onboarding@resend.dev';
      const from = fromRaw.includes('<') ? fromRaw : `JUHA <${fromRaw}>`;
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from,
        to: email,
        subject: `Dein JUHA-Code: ${code}`,
        // Klartext-Teil zusaetzlich zum HTML (multipart) -> bessere Spam-Einstufung.
        text: `Hi ${member.name},\n\ndein JUHA-Anmeldecode lautet:\n\n${code}\n\nGib ihn in der App ein. Der Code gilt etwa 10 Minuten. Wenn du das nicht warst, ignoriere die Mail einfach.`,
        html: `<div style="font-family:sans-serif;line-height:1.6;max-width:480px">
          <h2 style="color:#DE3E79;margin:0 0 8px">JUHA · Anmelden</h2>
          <p>Hi ${escapeHtml(member.name)}, dein Anmeldecode lautet:</p>
          <p style="margin:20px 0"><span style="display:inline-block;background:#FBE6EE;color:#DE3E79;padding:14px 26px;border-radius:12px;font-size:30px;font-weight:bold;letter-spacing:8px">${code}</span></p>
          <p style="color:#888;font-size:13px">Gib den Code in der App ein. Er gilt etwa 10 Minuten. Wenn du das nicht warst, ignoriere die Mail einfach.</p>
        </div>`,
      });
      return res.status(200).json({ ok: true });
    }

    if (action === 'verify') {
      const email = String(body.email || '').trim().toLowerCase();
      const code = String(body.code || '');
      if (!checkLoginCode(email, code)) {
        return res.status(401).json({ ok: false, reason: 'Code ungueltig oder abgelaufen.' });
      }
      const { dbId, titleProp } = await membersDb(token);
      const member = await findByEmail(token, dbId, titleProp, email);
      if (!member) return res.status(401).json({ ok: false, reason: 'Mitglied nicht gefunden.' });
      const session = signToken({ p: 'session', e: email, m: member.id, exp: nowPlus(365 * 24 * 3600) });
      return res.status(200).json({ ok: true, session, member });
    }

    if (action === 'me') {
      const payload = verifyToken(body.session, 'session');
      const { titleProp } = await membersDb(token);
      const page = await notionFetch(`/pages/${payload.m}`, token);
      return res.status(200).json({ ok: true, member: toMember(page, titleProp) });
    }

    return res.status(400).json({ ok: false, reason: 'Unbekannte action.' });
  } catch (e: any) {
    return res.status(401).json({ ok: false, reason: e?.message || 'Fehler' });
  }
}
