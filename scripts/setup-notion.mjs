/**
 * Legt die vier JUHA-Datenbanken in einer bestehenden, mit der Integration
 * GETEILTEN Notion-Seite an: Mitglieder, Termine, Anwesenheiten, Push-Abos.
 *
 * Nur die Titel-Spalte wird gesetzt — alle weiteren Spalten legt die App beim
 * ersten Zugriff selbst an (ensureProperties). Idempotent: bereits vorhandene
 * (mit der Integration geteilte) Datenbanken gleichen Namens werden uebersprungen.
 *
 * Aufruf (Token kommt aus .env):
 *   node scripts/setup-notion.mjs <NOTION-SEITEN-URL-oder-ID>
 */
import { readFileSync } from 'node:fs';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

// --- Token aus .env lesen (oder aus der Umgebung) ---
function loadToken() {
  let fromEnv = process.env.NOTION_TOKEN;
  try {
    const txt = readFileSync(new URL('../.env', import.meta.url), 'utf8');
    for (const line of txt.split(/\r?\n/)) {
      const m = line.match(/^\s*NOTION_TOKEN\s*=\s*(.+?)\s*$/);
      if (m) fromEnv = m[1];
    }
  } catch {
    /* keine .env — dann nur process.env */
  }
  return fromEnv;
}

// --- Notion-Page-ID aus URL/ID herausloesen und als UUID formatieren ---
function pageId(input) {
  if (!input) throw new Error('Bitte die Notion-Seiten-URL (oder -ID) als Argument uebergeben.');
  const raw = String(input).split('?')[0].split('#')[0];
  const hex = raw.replace(/[^0-9a-fA-F]/g, '');
  const id = hex.slice(-32);
  if (id.length !== 32) throw new Error(`Keine gueltige Notion-Page-ID im Argument gefunden: ${input}`);
  return `${id.slice(0, 8)}-${id.slice(8, 12)}-${id.slice(12, 16)}-${id.slice(16, 20)}-${id.slice(20)}`;
}

async function notion(path, token, init) {
  const res = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Notion ${res.status}: ${data?.message || 'Fehler'}`);
  return data;
}

const titleOf = (db) =>
  Array.isArray(db?.title) ? db.title.map((t) => t?.plain_text ?? '').join('') : '';

// Datenbanken, die angelegt werden sollen (Titel-Spalte -> Rest macht die App).
const DBS = [
  { name: 'Mitglieder', titleProp: 'Name' },
  { name: 'Termine', titleProp: 'Titel' },
  { name: 'Anwesenheiten', titleProp: 'Name' },
  { name: 'Push-Abos', titleProp: 'Name' },
];

async function main() {
  const token = loadToken();
  if (!token || token.includes('HIER_DEINEN')) {
    throw new Error('NOTION_TOKEN fehlt/Platzhalter — trage den JUHA-Token in die .env ein.');
  }
  const parent = pageId(process.argv[2]);

  // Bereits geteilte Datenbanken (zur Duplikat-Vermeidung).
  const search = await notion('/search', token, {
    method: 'POST',
    body: JSON.stringify({ filter: { value: 'database', property: 'object' }, page_size: 100 }),
  });
  const existing = new Set((search.results || []).map((d) => titleOf(d).toLowerCase()));

  for (const db of DBS) {
    if (existing.has(db.name.toLowerCase())) {
      console.log(`= "${db.name}" existiert schon (geteilt) — uebersprungen.`);
      continue;
    }
    const created = await notion('/databases', token, {
      method: 'POST',
      body: JSON.stringify({
        parent: { type: 'page_id', page_id: parent },
        title: [{ type: 'text', text: { content: db.name } }],
        properties: { [db.titleProp]: { title: {} } },
      }),
    });
    console.log(`+ "${db.name}" angelegt  (id: ${created.id})`);
  }

  console.log('\nFertig. Pruefe mit: <deploy-url>/api/notion-check');
}

main().catch((e) => {
  console.error('FEHLER:', e.message);
  process.exit(1);
});
