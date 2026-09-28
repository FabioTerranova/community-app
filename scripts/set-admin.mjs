/**
 * Setzt (oder entfernt) das Admin-Haekchen fuer Mitglieder in der Notion-DB
 * „Mitglieder" — per E-Mail, damit es unabhaengig von IDs wiederverwendbar ist.
 *
 * Nutzt den lokalen NOTION_TOKEN aus .env (wird NICHT ausgegeben).
 *
 * Aufruf:
 *   node scripts/set-admin.mjs a@x.de b@y.de          # diese Mails -> Admin=true
 *   node scripts/set-admin.mjs --off a@x.de           # Admin wieder entfernen
 *   node scripts/set-admin.mjs --dry a@x.de           # nur anzeigen
 */
import { readFileSync } from 'node:fs';

const NOTION = 'https://api.notion.com/v1';
const VERSION = '2022-06-28';

// .env einlesen (nur NOTION_TOKEN; ohne Ausgabe).
function envToken() {
  if (process.env.NOTION_TOKEN) return process.env.NOTION_TOKEN;
  try {
    const line = readFileSync(new URL('../.env', import.meta.url), 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith('NOTION_TOKEN='));
    return line ? line.slice('NOTION_TOKEN='.length).trim().replace(/^["']|["']$/g, '') : '';
  } catch {
    return '';
  }
}

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const off = args.includes('--off');
const emails = args.filter((a) => !a.startsWith('--')).map((e) => e.trim().toLowerCase());

async function nf(path, token, init) {
  const res = await fetch(`${NOTION}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': VERSION,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Notion ${res.status}: ${data?.message || 'Fehler'}`);
  return data;
}

async function main() {
  const token = envToken();
  if (!token) throw new Error('NOTION_TOKEN fehlt (weder Umgebung noch .env).');
  if (emails.length === 0) throw new Error('Bitte mindestens eine E-Mail angeben.');

  // Mitglieder-DB finden.
  const search = await nf('/search', token, {
    method: 'POST',
    body: JSON.stringify({ filter: { value: 'database', property: 'object' }, page_size: 50 }),
  });
  const db = (search.results || []).find((d) =>
    /mitglied|member/i.test((d.title || []).map((t) => t.plain_text || '').join('')),
  );
  if (!db) throw new Error('Mitglieder-Datenbank nicht gefunden (Integration teilen?).');

  const target = !off;
  console.log(`Admin ${target ? 'setzen' : 'entfernen'}${dry ? '  (DRY-RUN)' : ''} fuer ${emails.length} Mitglied(er):\n`);

  for (const email of emails) {
    const q = await nf(`/databases/${db.id}/query`, token, {
      method: 'POST',
      body: JSON.stringify({ filter: { property: 'E-Mail', email: { equals: email } }, page_size: 1 }),
    });
    const page = (q.results || [])[0];
    if (!page) {
      console.log(`  ✗  ${email}  -> kein Mitglied mit dieser E-Mail`);
      continue;
    }
    const titleProp = Object.entries(page.properties).find(([, p]) => p.type === 'title')?.[0];
    const name = titleProp
      ? (page.properties[titleProp].title || []).map((t) => t.plain_text || '').join('')
      : '(ohne Name)';
    const current = !!page.properties?.Admin?.checkbox;
    if (current === target) {
      console.log(`  =  ${name}  (${email})  -> bereits ${target ? 'Admin' : 'kein Admin'}`);
      continue;
    }
    if (dry) {
      console.log(`  +  ${name}  (${email})  -> wuerde ${target ? 'Admin' : 'kein Admin'}`);
      continue;
    }
    await nf(`/pages/${page.id}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ properties: { Admin: { checkbox: target } } }),
    });
    console.log(`  ✓  ${name}  (${email})  -> ${target ? 'Admin' : 'kein Admin'}`);
  }
}

main().catch((e) => {
  console.error('Fehler:', e.message);
  process.exit(1);
});
