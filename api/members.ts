import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  createPage,
  ensureProperties,
  prop,
  queryDatabase,
  read,
  resolveDatabaseId,
} from './_lib/notion';
import { MEMBERS, envId } from './_lib/schema';

/**
 * Mitglieder:
 *   GET  /api/members             -> { ok, members: Member[] }
 *   POST /api/members {name,email?,active?} -> { ok, member: Member }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.NOTION_TOKEN;
  if (!token) return res.status(500).json({ ok: false, reason: 'NOTION_TOKEN fehlt.' });

  try {
    const dbId = await resolveDatabaseId(token, MEMBERS.match, envId(MEMBERS));
    const titleProp = await ensureProperties(token, dbId, MEMBERS.props);

    if (req.method === 'GET') {
      const rows = await queryDatabase(token, dbId);
      const members = rows.map((r) => ({
        id: r.id,
        name: read.titleText(r.properties?.[titleProp]),
        email: read.email(r.properties?.['E-Mail']) || undefined,
        active: r.properties?.Aktiv ? read.checkbox(r.properties.Aktiv) : true,
      }));
      return res.status(200).json({ ok: true, members });
    }

    if (req.method === 'POST') {
      const { name, email, active } = (req.body || {}) as {
        name?: string;
        email?: string;
        active?: boolean;
      };
      if (!name) return res.status(400).json({ ok: false, reason: 'name fehlt.' });
      const page = await createPage(token, dbId, {
        [titleProp]: prop.title(name),
        'E-Mail': prop.email(email),
        Aktiv: prop.checkbox(active !== false),
      });
      return res
        .status(200)
        .json({ ok: true, member: { id: page.id, name, email, active: active !== false } });
    }

    return res.status(405).json({ ok: false, reason: 'Method not allowed.' });
  } catch (err: any) {
    return res.status(500).json({ ok: false, reason: err?.message || 'Fehler' });
  }
}
