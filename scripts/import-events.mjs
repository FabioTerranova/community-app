/**
 * Einmaliger Bulk-Import der JUHA-Termine ueber die Live-API (`POST /api/events`).
 *
 * Nutzt bewusst den bereits deployten Endpunkt (kein NOTION_TOKEN lokal noetig) —
 * die Server-Function legt fehlende Notion-Spalten selbst an (ensureProperties).
 *
 * IDEMPOTENT: liest zuerst die vorhandenen Termine und ueberspringt alles, was
 * (Titel + Datum) schon existiert. Mehrfaches Ausfuehren erzeugt also keine Dubletten.
 *
 * Aufruf:
 *   node scripts/import-events.mjs                 # gegen https://juha.app
 *   node scripts/import-events.mjs https://xyz.app # gegen andere Basis-URL
 *   node scripts/import-events.mjs --dry           # nur anzeigen, nichts schreiben
 */

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const base = (args.find((a) => a.startsWith('http')) || 'https://juha.app').replace(/\/$/, '');

// Platzhalter fuer Verantwortliche — spaeter direkt in Notion durch echte Namen ersetzbar.
const VORB = 'offen';
const SNACKS = 'offen, offen';

const SCHLANDERS_DATES = [
  '2026-10-02', '2026-10-09', '2026-10-16', '2026-10-23', '2026-10-30',
  '2026-11-13', '2026-11-20', '2026-11-27',
  '2026-12-04', '2026-12-11', '2026-12-18',
];

// Bozen (Plakat "Jugendgruppe", CGS): nur die bekannten kommenden Termine; 30.10 = Encounter Night.
// (18.09.2026 liegt in der Vergangenheit -> bewusst weggelassen.)
const BOZEN = [
  { date: '2026-10-02' },
  { date: '2026-10-16' },
  { date: '2026-10-30', encounter: true },
  { date: '2026-11-13' },
];

const events = [
  ...SCHLANDERS_DATES.map((date) => ({
    title: 'JUHA Schlanders',
    date,
    location: 'Schlanders · CGS Zentrum',
    notes: 'Fr 18:00–19:30 Uhr',
    vorbereitung: VORB,
    snacks: SNACKS,
  })),
  ...BOZEN.map(({ date, encounter }) => ({
    title: encounter ? 'JUHA Bozen – Encounter Night' : 'JUHA Bozen',
    date,
    location: 'Bozen · Achille-Grandistraße 22',
    notes: 'Fr 19:00–21:00 Uhr',
    vorbereitung: VORB,
    snacks: SNACKS,
  })),
];

const key = (e) => `${e.title}__${e.date}`;

async function main() {
  console.log(`Ziel: ${base}/api/events${dry ? '  (DRY-RUN)' : ''}`);

  // Vorhandene Termine holen -> Dubletten vermeiden.
  const res = await fetch(`${base}/api/events`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    throw new Error(`GET /api/events fehlgeschlagen: ${data?.reason || res.status}`);
  }
  const existing = new Set((data.events || []).map(key));
  console.log(`Bereits vorhanden: ${existing.size} Termine.`);

  let created = 0;
  let skipped = 0;
  for (const ev of events) {
    if (existing.has(key(ev))) {
      console.log(`  ⏭  ${ev.date}  ${ev.title}  (existiert)`);
      skipped++;
      continue;
    }
    if (dry) {
      console.log(`  +  ${ev.date}  ${ev.title}  [DRY]`);
      created++;
      continue;
    }
    const r = await fetch(`${base}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ev),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok || d?.ok === false) {
      console.error(`  ✗  ${ev.date}  ${ev.title}  -> ${d?.reason || r.status}`);
      continue;
    }
    console.log(`  ✓  ${ev.date}  ${ev.title}`);
    created++;
  }

  console.log(`\nFertig. Neu: ${created}, uebersprungen: ${skipped}.`);
}

main().catch((e) => {
  console.error('Fehler:', e.message);
  process.exit(1);
});
