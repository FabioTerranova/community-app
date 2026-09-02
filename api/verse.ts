import type { VercelRequest, VercelResponse } from '@vercel/node';
import { losungen2026, type DailyLosung } from './_data/losungen2026';

/**
 * "Vers des Tages" — Herrnhuter Tageslosung.
 *
 *   GET /api/verse            -> heutiger Vers (Zeitzone Europe/Berlin)
 *   GET /api/verse?date=YYYY-MM-DD  -> Vers fuer ein bestimmtes Datum
 *
 * Die Losungen sind fest im Repo gebuendelt (api/_data/losungen2026.ts) — bewusst
 * OHNE Live-Abruf von losungen.de, weil deren TLS-Zertifikatskette auf Servern
 * (Node/undici) haeufig ein "fetch failed" ausloest. So funktioniert der Vers
 * immer und ohne Netzabhaengigkeit. Fuer kuenftige Jahre einfach die jeweilige
 * Jahres-Datei ergaenzen (siehe scripts-Generator).
 *
 * Quelle: Losungen der Herrnhuter Bruedergemeine (Luther). Anzeige mit
 * Quellenangabe gestattet.
 */

interface DailyVerse extends DailyLosung {
  date?: string;
}

const YEARS: Record<string, Record<string, DailyLosung>> = {
  '2026': losungen2026,
};

/** Notfall-Vers, falls das Datum (z.B. kuenftiges Jahr) nicht gebuendelt ist. */
const FALLBACK: DailyVerse = {
  text: 'Denn ich weiß wohl, was ich für Gedanken über euch habe, spricht der HERR: Gedanken des Friedens und nicht des Leides, dass ich euch gebe Zukunft und Hoffnung.',
  reference: 'Jeremia 29,11',
  translation: 'Losung',
};

/** Heutiges Datum in Europe/Berlin als YYYY-MM-DD. */
function berlinToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  const raw = Array.isArray(req.query.date) ? req.query.date[0] : req.query.date;
  const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : berlinToday();
  const year = date.slice(0, 4);

  // 12h Edge-/Browser-Cache: aendert sich taeglich.
  res.setHeader('Cache-Control', 's-maxage=43200, stale-while-revalidate=86400');

  const verse = YEARS[year]?.[date];
  if (verse) return res.status(200).json({ ok: true, verse: { ...verse, date } });
  return res.status(200).json({ ok: true, verse: { ...FALLBACK, date } });
}
