/**
 * Generische Notion-Anbindung fuer die Community-App.
 *
 * Notion dient als einfache Datenbank: je Fachbereich eine Notion-Datenbank
 * (Mitglieder, Termine, Anwesenheiten). Die Integration ("Community App") muss
 * mit diesen Datenbanken GETEILT sein (••• -> Verbindungen). Ohne feste ID werden
 * sie per Notion-Suche ueber den Titel gefunden (per Env-Var ueberschreibbar).
 * Fehlende Spalten werden bei Bedarf automatisch angelegt (ensureProperties).
 *
 * Bewusst per fetch (kein SDK) gehalten — identisches Muster wie zenit-alpine-app.
 */

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export async function notionFetch(path: string, token: string, init?: RequestInit): Promise<any> {
  const res = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(init?.headers as Record<string, string> | undefined),
    },
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Notion ${res.status}: ${data?.message || 'Fehler'}`);
  }
  return data;
}

const titleOf = (db: any): string =>
  Array.isArray(db?.title) ? db.title.map((t: any) => t?.plain_text ?? '').join('') : '';

const dbCache = new Map<string, string>();

/**
 * Findet eine Datenbank ueber die Integration (per Titel-Regex) oder nutzt die
 * uebergebene feste ID (envId). Ergebnis wird pro Prozess gecached.
 */
export async function resolveDatabaseId(
  token: string,
  match: RegExp,
  envId?: string,
): Promise<string> {
  if (envId) return envId;
  const key = match.source;
  const cached = dbCache.get(key);
  if (cached) return cached;

  const data = await notionFetch('/search', token, {
    method: 'POST',
    body: JSON.stringify({ filter: { value: 'database', property: 'object' }, page_size: 50 }),
  });
  const results: any[] = Array.isArray(data.results) ? data.results : [];
  const db = results.find((d) => match.test(titleOf(d)));
  if (!db) {
    throw new Error(
      `Keine passende Notion-Datenbank (${match}) sichtbar — Datenbank mit der Integration teilen (••• -> Verbindungen).`,
    );
  }
  dbCache.set(key, db.id);
  return db.id;
}

/** Diagnose: welche Datenbanken sieht die Integration aktuell? */
export async function notionDiagnostics(token: string): Promise<{ id: string; title: string }[]> {
  const data = await notionFetch('/search', token, {
    method: 'POST',
    body: JSON.stringify({ filter: { value: 'database', property: 'object' }, page_size: 50 }),
  });
  const results: any[] = Array.isArray(data.results) ? data.results : [];
  return results.map((db) => ({ id: db.id, title: titleOf(db) || '(ohne Titel)' }));
}

/**
 * Legt fehlende Spalten an und liefert den Namen der Titel-Spalte zurueck.
 * `target` = gewuenschte Properties (Notion-Property-Definitionen).
 */
export async function ensureProperties(
  token: string,
  dbId: string,
  target: Record<string, any>,
): Promise<string> {
  const db = await notionFetch(`/databases/${dbId}`, token);
  const props = (db.properties || {}) as Record<string, any>;

  let titleProp = 'Name';
  for (const [name, def] of Object.entries(props)) {
    if ((def as any)?.type === 'title') titleProp = name;
  }

  const missing: Record<string, any> = {};
  for (const [name, def] of Object.entries(target)) {
    if (!props[name]) missing[name] = def;
  }
  if (Object.keys(missing).length) {
    await notionFetch(`/databases/${dbId}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ properties: missing }),
    });
  }
  return titleProp;
}

/** Datenbank abfragen (mit optionalem Notion-Filter/Sort/page_size). */
export async function queryDatabase(token: string, dbId: string, body: any = {}): Promise<any[]> {
  const data = await notionFetch(`/databases/${dbId}/query`, token, {
    method: 'POST',
    body: JSON.stringify({ page_size: 100, ...body }),
  });
  return Array.isArray(data.results) ? data.results : [];
}

/** Neue Seite in einer Datenbank anlegen. Gibt die Notion-Page zurueck. */
export async function createPage(
  token: string,
  dbId: string,
  properties: Record<string, any>,
  children?: any[],
): Promise<any> {
  return notionFetch('/pages', token, {
    method: 'POST',
    body: JSON.stringify({ parent: { database_id: dbId }, properties, ...(children ? { children } : {}) }),
  });
}

/** Properties einer bestehenden Seite aktualisieren. */
export async function updatePage(
  token: string,
  pageId: string,
  properties: Record<string, any>,
): Promise<any> {
  return notionFetch(`/pages/${pageId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ properties }),
  });
}

/** Helfer zum BAUEN von Notion-Properties (Schreiben). */
export const prop = {
  title: (v: string) => ({ title: [{ type: 'text', text: { content: String(v ?? '').slice(0, 1900) } }] }),
  text: (v: string) => ({ rich_text: [{ type: 'text', text: { content: String(v ?? '').slice(0, 1900) } }] }),
  email: (v?: string) => ({ email: v || null }),
  number: (v?: number) => ({ number: Number.isFinite(v as number) ? v : null }),
  date: (iso?: string) => ({ date: iso ? { start: iso } : null }),
  select: (name?: string) => ({ select: name ? { name } : null }),
  checkbox: (v: boolean) => ({ checkbox: !!v }),
};

/** Helfer zum LESEN von Notion-Properties. */
export const read = {
  titleText: (p: any): string =>
    Array.isArray(p?.title) ? p.title.map((t: any) => t?.plain_text ?? '').join('') : '',
  text: (p: any): string =>
    Array.isArray(p?.rich_text) ? p.rich_text.map((t: any) => t?.plain_text ?? '').join('') : '',
  email: (p: any): string => p?.email || '',
  number: (p: any): number | undefined => (typeof p?.number === 'number' ? p.number : undefined),
  date: (p: any): string => p?.date?.start || '',
  select: (p: any): string => p?.select?.name || '',
  checkbox: (p: any): boolean => !!p?.checkbox,
};
