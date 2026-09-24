/** Datums-Formatierung fuer die Anzeige (deutsch, ohne Abhaengigkeit von Intl-Locale-Daten). */

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const WEEKDAYS_LONG = [
  'Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag',
];
const MONTHS = [
  'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez',
];
const MONTHS_LONG = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August',
  'September', 'Oktober', 'November', 'Dezember',
];

/** "2026-08-31" -> { weekday: "Mo", day: 31, month: "Aug" }. */
export function parseDate(iso: string): { weekday: string; day: number; month: string } {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return { weekday: WEEKDAYS[date.getUTCDay()], day: d, month: MONTHS[m - 1] };
}

/** "2026-08-31" -> "Mo, 31. Aug". */
export function formatDate(iso: string): string {
  const p = parseDate(iso);
  return `${p.weekday}, ${p.day}. ${p.month}`;
}

/** "2026-08-31" -> "Montag, 31. August" (fuer den Begruessungs-Header). */
export function formatLongDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAYS_LONG[date.getUTCDay()]}, ${d}. ${MONTHS_LONG[m - 1]}`;
}

function toUTC(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Bucket fuer die Termin-Uebersicht relativ zu heute (Woche Mo–So):
 *   0 = Diese Woche, 1 = Nächste Woche, 2 = Später.
 * So sieht man auf einen Blick, was ansteht.
 */
export function weekBucket(iso: string, todayIso: string): 0 | 1 | 2 {
  const today = toUTC(todayIso);
  const mondayOffset = (today.getUTCDay() + 6) % 7; // Mo=0 … So=6
  const sundayThis = new Date(today);
  sundayThis.setUTCDate(today.getUTCDate() - mondayOffset + 6);
  const sundayNext = new Date(sundayThis);
  sundayNext.setUTCDate(sundayThis.getUTCDate() + 7);

  const day = toUTC(iso).getTime();
  if (day <= sundayThis.getTime()) return 0;
  if (day <= sundayNext.getTime()) return 1;
  return 2;
}

export const WEEK_BUCKET_LABELS = ['Diese Woche', 'Nächste Woche', 'Später'] as const;

/**
 * Saeubert Losungs-/Lehrtexte fuer die Anzeige: die Herrnhuter Quelle nutzt "/"
 * als Kursiv-Marker (z.B. "/Paulus schreibt:/") — die Slashes entfernen, den Text
 * behalten, doppelte Leerzeichen zusammenfassen.
 */
export function cleanVerseText(text?: string): string {
  return String(text ?? '')
    .replace(/\//g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Passendes Emoji je Termin-Art (aus dem Titel abgeleitet). */
export function eventIcon(title: string): string {
  return eventCategory(title).icon;
}

export interface EventCategory {
  key: string;
  label: string;
  icon: string;
  /** Feste Kategorie-Farbe (marken-unabhaengig, fuer farbige Chips). */
  color: string;
}

/** Kategorie eines Termins (aus dem Titel abgeleitet) — fuer farbige Chips + Filter. */
export function eventCategory(title: string): EventCategory {
  const t = title.toLowerCase();
  if (t.includes('juha') || t.includes('encounter'))
    return { key: 'juha', label: 'JUHA', icon: '🔥', color: '#2D9CDB' };
  if (t.includes('gottesdienst') || t.includes('celebration'))
    return { key: 'gottesdienst', label: 'Gottesdienst', icon: '⛪', color: '#E0A72B' };
  if (t.includes('gebet'))
    return { key: 'gebet', label: 'Gebet', icon: '🙏', color: '#9B51E0' };
  if (t.includes('hauskreis') || t.includes('kleingruppe'))
    return { key: 'kleingruppe', label: 'Kleingruppe', icon: '🏠', color: '#27AE87' };
  if (t.includes('jugend') || t.includes('d4j') || t.includes('teen'))
    return { key: 'jugend', label: 'Jugendgruppe', icon: '✨', color: '#2D9CDB' };
  if (t.includes('sozo'))
    return { key: 'sozo', label: 'SOZO', icon: '💛', color: '#E0658A' };
  if (t.includes('lobpreis') || t.includes('worship'))
    return { key: 'lobpreis', label: 'Lobpreis', icon: '🎶', color: '#EB5757' };
  return { key: 'sonstiges', label: 'Termin', icon: '📅', color: '#8892A0' };
}
