import type { VercelRequest, VercelResponse } from '@vercel/node';
import { unzipSync, strFromU8 } from 'fflate';

/**
 * "Vers des Tages" — Herrnhuter Tageslosung, live von losungen.de.
 *
 *   GET /api/verse            -> heutiger Vers (Zeitzone Europe/Berlin)
 *   GET /api/verse?date=YYYY-MM-DD  -> Vers fuer ein bestimmtes Datum
 *
 * Warum ueber diese Function und nicht direkt aus der App? Die offizielle Datei
 * liegt als ZIP (XML) auf losungen.de — der Browser koennte sie wegen CORS gar
 * nicht laden. Hier serverseitig: einmal pro Jahr die ZIP holen, entpacken,
 * im Speicher halten (Cache ueber warme Lambda-Aufrufe) und als sauberes JSON
 * zurueckgeben. Faellt bei Problemen auf einen Platzhalter-Vers zurueck, damit
 * die App nie leer bleibt.
 *
 * Quelle: Losungen der Herrnhuter Bruedergemeine (Luther-Text). Nutzung siehe
 * NUTZUNGSBEDINGUNGEN in der ZIP; Anzeige mit Quellenangabe ist gestattet.
 */

interface DailyVerse {
  text: string;
  reference: string;
  translation: string;
  date?: string;
  lehrtext?: string;
  lehrtextReference?: string;
}

/** Notfall-Vers, falls der Download/Parse scheitert (App bleibt nie leer). */
const FALLBACK: DailyVerse = {
  text: 'Denn ich weiß wohl, was ich für Gedanken über euch habe, spricht der HERR: Gedanken des Friedens und nicht des Leides, dass ich euch gebe Zukunft und Hoffnung.',
  reference: 'Jeremia 29,11',
  translation: 'Losung',
};

const ZIP_URL = (year: number) =>
  `https://www.losungen.de/fileadmin/media-losungen/download/Losung_${year}_XML.zip`;

/** Cache pro Jahr ueber warme Function-Aufrufe hinweg (Datum -> Vers). */
const yearCache = new Map<number, Map<string, DailyVerse>>();

/** Heutiges Datum in Europe/Berlin als YYYY-MM-DD. */
function berlinToday(): string {
  // en-CA liefert bereits das ISO-Format YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, '&') // zuletzt, sonst doppelt dekodiert
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? decodeXml(m[1]) : '';
}

/** Parst die Jahres-XML zu einer Map "YYYY-MM-DD" -> Vers. */
function parseYear(xml: string): Map<string, DailyVerse> {
  const byDate = new Map<string, DailyVerse>();
  const dayRe = /<Losungen>([\s\S]*?)<\/Losungen>/g;
  let m: RegExpExecArray | null;
  while ((m = dayRe.exec(xml)) !== null) {
    const block = m[1];
    const datum = tag(block, 'Datum'); // z.B. "2026-01-01T00:00:00.000"
    const date = datum.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    byDate.set(date, {
      date,
      text: tag(block, 'Losungstext'),
      reference: tag(block, 'Losungsvers'),
      translation: 'Losung',
      lehrtext: tag(block, 'Lehrtext') || undefined,
      lehrtextReference: tag(block, 'Lehrtextvers') || undefined,
    });
  }
  return byDate;
}

/** Laedt (und cached) die Losungen eines Jahres. Wirft bei Netz-/Parse-Fehler. */
async function loadYear(year: number): Promise<Map<string, DailyVerse>> {
  const cached = yearCache.get(year);
  if (cached) return cached;

  const res = await fetch(ZIP_URL(year));
  if (!res.ok) throw new Error(`Download fehlgeschlagen: HTTP ${res.status}`);
  const zip = unzipSync(new Uint8Array(await res.arrayBuffer()));

  const xmlName = Object.keys(zip).find((n) => n.toLowerCase().endsWith('.xml'));
  if (!xmlName) throw new Error('Keine XML in der ZIP gefunden.');

  const byDate = parseYear(strFromU8(zip[xmlName]));
  if (byDate.size === 0) throw new Error('XML enthielt keine Losungen.');

  yearCache.set(year, byDate);
  return byDate;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.date) ? req.query.date[0] : req.query.date;
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : berlinToday();
  const year = Number(date.slice(0, 4));

  // 6h Edge/Browser-Cache: aendert sich taeglich, entlastet losungen.de.
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');

  try {
    const byDate = await loadYear(year);
    const verse = byDate.get(date);
    if (!verse) return res.status(200).json({ ok: true, verse: { ...FALLBACK, date } });
    return res.status(200).json({ ok: true, verse });
  } catch (err: any) {
    // Nie hart scheitern: lieber Platzhalter als leere Karte in der App.
    return res.status(200).json({ ok: true, verse: { ...FALLBACK, date }, note: err?.message });
  }
}
